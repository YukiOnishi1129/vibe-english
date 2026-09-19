import {
  withUserTransaction,
  courseRepo,
  chunkRepo,
  progressRepo,
  flagRepo,
  drillResultRepo,
  type AppDatabase,
  type Trx,
} from "@vibe-english/db";
import type {
  Chunk,
  CourseDetail,
  CourseSummary,
  DrillType,
} from "./types";
import { HARD_FLAG } from "./chunk-usecase";

type CourseChunkRow = Awaited<
  ReturnType<typeof courseRepo.listChunksForCourse>
>[number];

function isDone(chunk: Chunk): boolean {
  return (chunk.progress?.completedCount ?? 0) > 0;
}

/** Builds the per-user view of a set of course chunks. */
async function decorateCourseChunks(
  trx: Trx,
  userId: string,
  rows: CourseChunkRow[],
): Promise<Chunk[]> {
  const chunkIds = rows.map((row) => row.id);
  const [examples, drills, progress, hardIds, struggledIds] = await Promise.all([
    chunkRepo.listExamplesForChunks(trx, chunkIds),
    chunkRepo.listDrillsForChunks(trx, chunkIds),
    progressRepo.listProgressForChunks(trx, userId, chunkIds),
    flagRepo.listFlagsForChunks(trx, userId, chunkIds, HARD_FLAG),
    drillResultRepo.listStruggledChunkIds(trx, userId),
  ]);

  const progressByChunk = new Map(progress.map((row) => [row.chunk_id, row]));
  const hard = new Set(hardIds);
  const struggled = new Set(struggledIds);

  const examplesByChunk = new Map<string, typeof examples>();
  for (const example of examples) {
    const list = examplesByChunk.get(example.chunk_id) ?? [];
    list.push(example);
    examplesByChunk.set(example.chunk_id, list);
  }

  const drillsByChunk = new Map<string, typeof drills>();
  for (const drill of drills) {
    const list = drillsByChunk.get(drill.chunk_id) ?? [];
    list.push(drill);
    drillsByChunk.set(drill.chunk_id, list);
  }

  return rows.map((row) => {
    const progressRow = progressByChunk.get(row.id);
    return {
      id: row.id,
      phrase: row.phrase,
      meaningJa: row.meaning_ja,
      situation: row.situation,
      nuance: row.nuance,
      level: row.level,
      sortOrder: row.sort_order,
      examples: (examplesByChunk.get(row.id) ?? []).map((example) => ({
        id: example.id,
        english: example.english,
        japanese: example.japanese,
      })),
      drills: (drillsByChunk.get(row.id) ?? []).map((drill) => ({
        id: drill.id,
        type: drill.type as DrillType,
        prompt: drill.prompt,
        answer: drill.answer,
        pieces: drill.pieces,
      })),
      progress: progressRow
        ? {
            seenCount: progressRow.seen_count,
            completedCount: progressRow.completed_count,
            lastSeenAt:
              progressRow.last_seen_at instanceof Date
                ? progressRow.last_seen_at.toISOString()
                : progressRow.last_seen_at,
            lastCompletedAt:
              progressRow.last_completed_at instanceof Date
                ? progressRow.last_completed_at.toISOString()
                : progressRow.last_completed_at,
          }
        : null,
      isHard: hard.has(row.id),
      needsReview: struggled.has(row.id),
    };
  });
}

/** Course list with the learner's progress, for the おさらい landing screen. */
export async function getCourses(
  db: AppDatabase,
  userId: string,
): Promise<CourseSummary[]> {
  return withUserTransaction(db, userId, async (trx) => {
    const [courses, selected] = await Promise.all([
      courseRepo.listCourses(trx),
      courseRepo.findSelectedCourse(trx, userId),
    ]);

    return Promise.all(
      courses.map(async (course) => {
        const rows = await courseRepo.listChunksForCourse(trx, course.id);
        const chunks = await decorateCourseChunks(trx, userId, rows);

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          doneCount: chunks.filter(isDone).length,
          total: chunks.length,
          isSelected: selected?.course_id === course.id,
        };
      }),
    );
  });
}

/**
 * The full curriculum for one course.
 *
 * This is the screen the learner opens deliberately — the daily view never
 * shows the total, so the size of the course cannot discourage them before
 * they have started.
 */
export async function getCourseDetail(
  db: AppDatabase,
  userId: string,
  courseId: string,
): Promise<CourseDetail | null> {
  return withUserTransaction(db, userId, async (trx) => {
    const course = await courseRepo.findCourseById(trx, courseId);
    if (!course) return null;

    const [units, rows] = await Promise.all([
      courseRepo.listUnitsForCourse(trx, courseId),
      courseRepo.listChunksForCourse(trx, courseId),
    ]);

    const chunks = await decorateCourseChunks(trx, userId, rows);
    const byUnit = new Map<string, Chunk[]>();
    rows.forEach((row, index) => {
      if (!row.unit_id) return;
      const list = byUnit.get(row.unit_id) ?? [];
      list.push(chunks[index]);
      byUnit.set(row.unit_id, list);
    });

    const detailUnits = units.map((unit) => {
      const unitChunks = byUnit.get(unit.id) ?? [];
      return {
        id: unit.id,
        title: unit.title,
        description: unit.description,
        chunks: unitChunks,
        doneCount: unitChunks.filter(isDone).length,
      };
    });

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      units: detailUnits,
      doneCount: chunks.filter(isDone).length,
      total: chunks.length,
      nextChunkId: chunks.find((chunk) => !isDone(chunk))?.id ?? null,
    };
  });
}

export async function chooseCourse(
  db: AppDatabase,
  userId: string,
  courseId: string,
): Promise<boolean> {
  return withUserTransaction(db, userId, async (trx) => {
    const course = await courseRepo.findCourseById(trx, courseId);
    if (!course) return false;

    await courseRepo.selectCourse(trx, userId, courseId);
    return true;
  });
}
