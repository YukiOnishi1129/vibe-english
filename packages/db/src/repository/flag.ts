import type { Trx } from "../withUserTransaction";

// user_flags is RLS-protected; see the note in progress.ts.

export async function listFlaggedChunkIds(
  trx: Trx,
  userId: string,
  flag: string,
) {
  const rows = await trx
    .selectFrom("user_flags")
    .select("chunk_id")
    .where("user_id", "=", userId)
    .where("flag", "=", flag)
    .execute();

  return rows.map((row) => row.chunk_id);
}

export async function listFlagsForChunks(
  trx: Trx,
  userId: string,
  chunkIds: string[],
  flag: string,
) {
  if (chunkIds.length === 0) return [];

  const rows = await trx
    .selectFrom("user_flags")
    .select("chunk_id")
    .where("user_id", "=", userId)
    .where("chunk_id", "in", chunkIds)
    .where("flag", "=", flag)
    .execute();

  return rows.map((row) => row.chunk_id);
}

/** Idempotent: adding an existing flag is a no-op. */
export async function addFlag(
  trx: Trx,
  userId: string,
  chunkId: string,
  flag: string,
) {
  await trx
    .insertInto("user_flags")
    .values({ user_id: userId, chunk_id: chunkId, flag })
    .onConflict((oc) => oc.columns(["user_id", "chunk_id", "flag"]).doNothing())
    .execute();
}

/** Idempotent: removing a missing flag is a no-op. */
export async function removeFlag(
  trx: Trx,
  userId: string,
  chunkId: string,
  flag: string,
) {
  await trx
    .deleteFrom("user_flags")
    .where("user_id", "=", userId)
    .where("chunk_id", "=", chunkId)
    .where("flag", "=", flag)
    .execute();
}
