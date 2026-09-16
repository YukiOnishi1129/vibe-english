import { sql } from "kysely";
import type { Trx } from "../withUserTransaction";

// user_progress is RLS-protected: the surrounding transaction must have set
// app.user_id, otherwise these queries see and write nothing.

export async function listProgressForUser(trx: Trx, userId: string) {
  return trx
    .selectFrom("user_progress")
    .select([
      "chunk_id",
      "seen_count",
      "completed_count",
      "last_seen_at",
      "last_completed_at",
    ])
    .where("user_id", "=", userId)
    .execute();
}

export async function listProgressForChunks(
  trx: Trx,
  userId: string,
  chunkIds: string[],
) {
  if (chunkIds.length === 0) return [];

  return trx
    .selectFrom("user_progress")
    .select([
      "chunk_id",
      "seen_count",
      "completed_count",
      "last_seen_at",
      "last_completed_at",
    ])
    .where("user_id", "=", userId)
    .where("chunk_id", "in", chunkIds)
    .execute();
}

/** Upserts progress, counting one more view and one more completion. */
export async function upsertCompletion(
  trx: Trx,
  userId: string,
  chunkId: string,
) {
  return trx
    .insertInto("user_progress")
    .values({
      user_id: userId,
      chunk_id: chunkId,
      seen_count: 1,
      completed_count: 1,
      last_seen_at: sql<Date>`now()`,
      last_completed_at: sql<Date>`now()`,
    })
    .onConflict((oc) =>
      oc.columns(["user_id", "chunk_id"]).doUpdateSet({
        seen_count: sql<number>`user_progress.seen_count + 1`,
        completed_count: sql<number>`user_progress.completed_count + 1`,
        last_seen_at: sql<Date>`now()`,
        last_completed_at: sql<Date>`now()`,
      }),
    )
    .returning([
      "chunk_id",
      "seen_count",
      "completed_count",
      "last_seen_at",
      "last_completed_at",
    ])
    .executeTakeFirstOrThrow();
}
