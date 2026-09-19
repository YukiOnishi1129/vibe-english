import type { Trx } from "../withUserTransaction";

// Repositories receive a transaction and only run queries. Transaction
// boundaries belong to the usecase layer.

/**
 * The everyday pool that today's lesson draws from.
 *
 * Chunks belonging to a course unit are excluded: those are worked through in
 * order under おさらい, and mixing them into the daily shuffle would break
 * both the ordering and the sense of covering a topic.
 */
export async function listActiveChunks(trx: Trx) {
  return trx
    .selectFrom("chunks")
    .select([
      "id",
      "phrase",
      "meaning_ja",
      "situation",
      "nuance",
      "level",
      "sort_order",
    ])
    .where("is_active", "=", true)
    .where("unit_id", "is", null)
    .orderBy("sort_order", "asc")
    .orderBy("id", "asc")
    .execute();
}

export async function findChunkById(trx: Trx, chunkId: string) {
  return trx
    .selectFrom("chunks")
    .select([
      "id",
      "phrase",
      "meaning_ja",
      "situation",
      "nuance",
      "level",
      "sort_order",
    ])
    .where("id", "=", chunkId)
    .where("is_active", "=", true)
    .executeTakeFirst();
}

export async function listChunksByIds(trx: Trx, chunkIds: string[]) {
  if (chunkIds.length === 0) return [];

  return trx
    .selectFrom("chunks")
    .select([
      "id",
      "phrase",
      "meaning_ja",
      "situation",
      "nuance",
      "level",
      "sort_order",
    ])
    .where("id", "in", chunkIds)
    .where("is_active", "=", true)
    .orderBy("sort_order", "asc")
    .orderBy("id", "asc")
    .execute();
}

export async function listExamplesForChunks(trx: Trx, chunkIds: string[]) {
  if (chunkIds.length === 0) return [];

  return trx
    .selectFrom("chunk_examples")
    .select(["id", "chunk_id", "english", "japanese"])
    .where("chunk_id", "in", chunkIds)
    .orderBy("sort_order", "asc")
    .orderBy("id", "asc")
    .execute();
}

export async function listDrillsForChunks(trx: Trx, chunkIds: string[]) {
  if (chunkIds.length === 0) return [];

  return trx
    .selectFrom("chunk_drills")
    .select(["id", "chunk_id", "type", "prompt", "answer", "pieces"])
    .where("chunk_id", "in", chunkIds)
    .orderBy("sort_order", "asc")
    .orderBy("id", "asc")
    .execute();
}
