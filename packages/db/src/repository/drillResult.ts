import { sql } from "kysely";
import type { Trx } from "../withUserTransaction";

// user_drill_results is RLS-protected; the surrounding transaction must have
// set app.user_id.

export async function recordResult(
  trx: Trx,
  userId: string,
  chunkId: string,
  result: "got_it" | "struggled",
) {
  await trx
    .insertInto("user_drill_results")
    .values({
      // Content-addressed id keeps one row per user/chunk/timestamp without
      // needing a sequence.
      id: `${userId}:${chunkId}:${Date.now()}`,
      user_id: userId,
      chunk_id: chunkId,
      result,
    })
    .execute();
}

/**
 * Chunks whose most recent result was "struggled" — the review list.
 * Only the latest attempt counts, so getting it right clears it.
 */
export async function listStruggledChunkIds(trx: Trx, userId: string) {
  const rows = await trx
    .selectFrom("user_drill_results as r")
    .select("r.chunk_id")
    .where("r.user_id", "=", userId)
    .where("r.result", "=", "struggled")
    .where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom("user_drill_results as newer")
            .select(sql`1`.as("x"))
            .whereRef("newer.chunk_id", "=", "r.chunk_id")
            .where("newer.user_id", "=", userId)
            .whereRef("newer.created_at", ">", "r.created_at"),
        ),
      ),
    )
    .execute();

  return [...new Set(rows.map((row) => row.chunk_id))];
}

/** How many times each chunk was reported as hard, for ordering the review. */
export async function countStrugglesByChunk(trx: Trx, userId: string) {
  const rows = await trx
    .selectFrom("user_drill_results")
    .select(["chunk_id", (eb) => eb.fn.countAll<number>().as("count")])
    .where("user_id", "=", userId)
    .where("result", "=", "struggled")
    .groupBy("chunk_id")
    .execute();

  return new Map(rows.map((row) => [row.chunk_id, Number(row.count)]));
}
