import {
  withUserTransaction,
  chunkRepo,
  progressRepo,
  flagRepo,
  drillResultRepo,
  streakRepo,
  type AppDatabase,
  type Trx,
} from "@vibe-english/db";
import type {
  Chunk,
  ChunkProgress,
  DailySession,
  DrillResult,
  DrillType,
  ReviewGroup,
  Streak,
} from "./types";

export const HARD_FLAG = "hard";

/** How many chunks one day's session holds. Small on purpose: the app sells
 *  "3 minutes a day", so the queue has to end. */
export const DAILY_TARGET = 5;

type ChunkRow = Awaited<ReturnType<typeof chunkRepo.listActiveChunks>>[number];
type ExampleRow = Awaited<
  ReturnType<typeof chunkRepo.listExamplesForChunks>
>[number];
type DrillRow = Awaited<
  ReturnType<typeof chunkRepo.listDrillsForChunks>
>[number];
type ProgressRow = Awaited<
  ReturnType<typeof progressRepo.listProgressForChunks>
>[number];

function toIsoString(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toProgress(row: ProgressRow | undefined): ChunkProgress | null {
  if (!row) return null;
  return {
    seenCount: row.seen_count,
    completedCount: row.completed_count,
    lastSeenAt: toIsoString(row.last_seen_at),
    lastCompletedAt: toIsoString(row.last_completed_at),
  };
}

function assemble(
  chunks: ChunkRow[],
  examples: ExampleRow[],
  drills: DrillRow[],
  progress: ProgressRow[],
  hardChunkIds: string[],
  struggledChunkIds: string[],
): Chunk[] {
  const progressByChunk = new Map(progress.map((row) => [row.chunk_id, row]));
  const hard = new Set(hardChunkIds);
  const struggled = new Set(struggledChunkIds);

  const examplesByChunk = new Map<string, ExampleRow[]>();
  for (const example of examples) {
    const list = examplesByChunk.get(example.chunk_id) ?? [];
    list.push(example);
    examplesByChunk.set(example.chunk_id, list);
  }

  const drillsByChunk = new Map<string, DrillRow[]>();
  for (const drill of drills) {
    const list = drillsByChunk.get(drill.chunk_id) ?? [];
    list.push(drill);
    drillsByChunk.set(drill.chunk_id, list);
  }

  return chunks.map((chunk) => ({
    id: chunk.id,
    phrase: chunk.phrase,
    meaningJa: chunk.meaning_ja,
    situation: chunk.situation,
    nuance: chunk.nuance,
    level: chunk.level,
    sortOrder: chunk.sort_order,
    examples: (examplesByChunk.get(chunk.id) ?? []).map((example) => ({
      id: example.id,
      english: example.english,
      japanese: example.japanese,
    })),
    drills: (drillsByChunk.get(chunk.id) ?? []).map((drill) => ({
      id: drill.id,
      type: drill.type as DrillType,
      prompt: drill.prompt,
      answer: drill.answer,
    })),
    progress: toProgress(progressByChunk.get(chunk.id)),
    isHard: hard.has(chunk.id),
    needsReview: struggled.has(chunk.id),
  }));
}

/** Loads the per-user overlay (progress + hard flags) for a set of chunks. */
async function decorate(
  trx: Trx,
  userId: string,
  chunks: ChunkRow[],
): Promise<Chunk[]> {
  const chunkIds = chunks.map((chunk) => chunk.id);
  const [examples, drills, progress, hardChunkIds, struggledChunkIds] =
    await Promise.all([
      chunkRepo.listExamplesForChunks(trx, chunkIds),
      chunkRepo.listDrillsForChunks(trx, chunkIds),
      progressRepo.listProgressForChunks(trx, userId, chunkIds),
      flagRepo.listFlagsForChunks(trx, userId, chunkIds, HARD_FLAG),
      drillResultRepo.listStruggledChunkIds(trx, userId),
    ]);

  return assemble(
    chunks,
    examples,
    drills,
    progress,
    hardChunkIds,
    struggledChunkIds,
  );
}

/**
 * Formats a calendar day as YYYY-MM-DD in local time.
 *
 * A Postgres `date` arrives as a Date pinned to local midnight, so
 * toISOString() would shift it to the previous day anywhere east of UTC.
 */
function toLocalDay(value: Date | string | null): string | null {
  if (value === null) return null;
  if (typeof value === "string") return value.slice(0, 10);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today in local time, matching how the database compares current_date. */
function localToday(): string {
  return toLocalDay(new Date())!;
}

function toStreak(
  row:
    | {
        current_streak: number;
        longest_streak: number;
        last_practiced_on: Date | string | null;
      }
    | undefined,
  today: string,
): Streak {
  if (!row) return { current: 0, longest: 0, practicedToday: false };

  const last = toLocalDay(row.last_practiced_on);
  return {
    current: row.current_streak,
    longest: row.longest_streak,
    practicedToday: last === today,
  };
}

function completedOn(chunk: Chunk, day: string): boolean {
  const completedAt = chunk.progress?.lastCompletedAt;
  if (!completedAt) return false;
  // lastCompletedAt is a timestamptz in ISO form; compare in local time so a
  // late-evening session still counts as today.
  return toLocalDay(new Date(completedAt)) === day;
}

/**
 * Today's session: a short, finite queue rather than the whole catalogue.
 *
 * Ordering is deliberately simple (no SRS yet): anything already done today
 * stays in place so the list does not reshuffle mid-session, then chunks the
 * learner struggled with, then never-completed ones, then the rest.
 */
export async function getDailySession(
  db: AppDatabase,
  userId: string,
): Promise<DailySession> {
  return withUserTransaction(db, userId, async (trx) => {
    const [rows, streakRow] = await Promise.all([
      chunkRepo.listActiveChunks(trx),
      streakRepo.findStreak(trx, userId),
    ]);

    const all = await decorate(trx, userId, rows);
    const today = localToday();

    const rank = (chunk: Chunk) => {
      if (completedOn(chunk, today)) return 0;
      if (chunk.needsReview) return 1;
      if ((chunk.progress?.completedCount ?? 0) === 0) return 2;
      return 3;
    };

    const queue = [...all]
      .sort((a, b) => rank(a) - rank(b) || a.sortOrder - b.sortOrder)
      .slice(0, DAILY_TARGET);

    return {
      chunks: queue,
      doneCount: queue.filter((chunk) => completedOn(chunk, today)).length,
      total: queue.length,
      streak: toStreak(streakRow, today),
    };
  });
}

/** Kept for the plain listing; the daily session is what the UI uses. */
export async function getTodayChunks(
  db: AppDatabase,
  userId: string,
): Promise<Chunk[]> {
  return withUserTransaction(db, userId, async (trx) => {
    const chunks = await chunkRepo.listActiveChunks(trx);
    return decorate(trx, userId, chunks);
  });
}

/** Review buckets, derived from what the learner already did. */
export async function getReviewGroups(
  db: AppDatabase,
  userId: string,
): Promise<ReviewGroup[]> {
  return withUserTransaction(db, userId, async (trx) => {
    const [struggledIds, hardIds, counts] = await Promise.all([
      drillResultRepo.listStruggledChunkIds(trx, userId),
      flagRepo.listFlaggedChunkIds(trx, userId, HARD_FLAG),
      drillResultRepo.countStrugglesByChunk(trx, userId),
    ]);

    const ids = [...new Set([...struggledIds, ...hardIds])];
    const chunks = await decorate(
      trx,
      userId,
      await chunkRepo.listChunksByIds(trx, ids),
    );

    const struggledSet = new Set(struggledIds);
    const hardSet = new Set(hardIds);

    return [
      {
        key: "struggled" as const,
        label: "よく間違える",
        chunks: chunks
          .filter((chunk) => struggledSet.has(chunk.id))
          // Most-missed first, so the worst offenders surface.
          .sort(
            (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0),
          ),
      },
      {
        key: "hard" as const,
        label: "あとで見る",
        chunks: chunks.filter((chunk) => hardSet.has(chunk.id)),
      },
    ];
  });
}

/**
 * Records the self-reported outcome, counts the completion and rolls the
 * streak — one transaction, so a failure cannot leave a half-finished day.
 */
export async function finishChunk(
  db: AppDatabase,
  userId: string,
  chunkId: string,
  result: DrillResult,
): Promise<{ progress: ChunkProgress; streak: Streak } | null> {
  return withUserTransaction(db, userId, async (trx) => {
    const chunk = await chunkRepo.findChunkById(trx, chunkId);
    if (!chunk) return null;

    await drillResultRepo.recordResult(trx, userId, chunkId, result);
    const progressRow = await progressRepo.upsertCompletion(trx, userId, chunkId);
    const streakRow = await streakRepo.touchStreak(trx, userId);

    return {
      progress: toProgress(progressRow)!,
      streak: toStreak(streakRow, localToday()),
    };
  });
}

export async function getChunk(
  db: AppDatabase,
  userId: string,
  chunkId: string,
): Promise<Chunk | null> {
  return withUserTransaction(db, userId, async (trx) => {
    const chunk = await chunkRepo.findChunkById(trx, chunkId);
    if (!chunk) return null;

    const [decorated] = await decorate(trx, userId, [chunk]);
    return decorated ?? null;
  });
}

export async function getHardChunks(
  db: AppDatabase,
  userId: string,
): Promise<Chunk[]> {
  return withUserTransaction(db, userId, async (trx) => {
    const hardChunkIds = await flagRepo.listFlaggedChunkIds(
      trx,
      userId,
      HARD_FLAG,
    );
    const chunks = await chunkRepo.listChunksByIds(trx, hardChunkIds);
    return decorate(trx, userId, chunks);
  });
}

export async function completeChunk(
  db: AppDatabase,
  userId: string,
  chunkId: string,
): Promise<ChunkProgress | null> {
  return withUserTransaction(db, userId, async (trx) => {
    const chunk = await chunkRepo.findChunkById(trx, chunkId);
    if (!chunk) return null;

    const row = await progressRepo.upsertCompletion(trx, userId, chunkId);
    return toProgress(row);
  });
}

export async function setHardFlag(
  db: AppDatabase,
  userId: string,
  chunkId: string,
  hard: boolean,
): Promise<boolean> {
  return withUserTransaction(db, userId, async (trx) => {
    const chunk = await chunkRepo.findChunkById(trx, chunkId);
    if (!chunk) return false;

    if (hard) {
      await flagRepo.addFlag(trx, userId, chunkId, HARD_FLAG);
    } else {
      await flagRepo.removeFlag(trx, userId, chunkId, HARD_FLAG);
    }
    return true;
  });
}
