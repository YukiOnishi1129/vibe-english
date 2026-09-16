import {
  withUserTransaction,
  chunkRepo,
  progressRepo,
  flagRepo,
  type AppDatabase,
  type Trx,
} from "@vibe-english/db";
import type { Chunk, ChunkProgress, DrillType } from "./types";

export const HARD_FLAG = "hard";

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
): Chunk[] {
  const progressByChunk = new Map(progress.map((row) => [row.chunk_id, row]));
  const hard = new Set(hardChunkIds);

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
  }));
}

/** Loads the per-user overlay (progress + hard flags) for a set of chunks. */
async function decorate(
  trx: Trx,
  userId: string,
  chunks: ChunkRow[],
): Promise<Chunk[]> {
  const chunkIds = chunks.map((chunk) => chunk.id);
  const [examples, drills, progress, hardChunkIds] = await Promise.all([
    chunkRepo.listExamplesForChunks(trx, chunkIds),
    chunkRepo.listDrillsForChunks(trx, chunkIds),
    progressRepo.listProgressForChunks(trx, userId, chunkIds),
    flagRepo.listFlagsForChunks(trx, userId, chunkIds, HARD_FLAG),
  ]);

  return assemble(chunks, examples, drills, progress, hardChunkIds);
}

/**
 * MVP "today": every active chunk in sort order. No recommendation algorithm
 * yet — deliberately boring and predictable.
 */
export async function getTodayChunks(
  db: AppDatabase,
  userId: string,
): Promise<Chunk[]> {
  return withUserTransaction(db, userId, async (trx) => {
    const chunks = await chunkRepo.listActiveChunks(trx);
    return decorate(trx, userId, chunks);
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
