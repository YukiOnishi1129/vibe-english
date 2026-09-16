import { sql, type Transaction } from "kysely";
import type { AppDatabase } from "./client";
import type { DB } from "./generated";

export type Trx = Transaction<DB>;

/**
 * Runs `fn` inside a transaction scoped to one user.
 *
 * Before any application query, the transaction sets `app.user_id`, which the
 * RLS policies on user_progress / user_flags compare against user_id. The third
 * argument to set_config is `is_local = true`, so the setting is rolled back
 * with the transaction and can never leak to the next user on a pooled
 * connection.
 *
 * Read-only usecases must use this too: without the setting,
 * current_setting('app.user_id', true) is NULL and RLS returns zero rows.
 */
export async function withUserTransaction<T>(
  db: AppDatabase,
  userId: string,
  fn: (trx: Trx) => Promise<T>,
): Promise<T> {
  if (!userId) {
    throw new Error("withUserTransaction requires a userId");
  }

  return db.transaction().execute(async (trx) => {
    await sql`select set_config('app.user_id', ${userId}, true)`.execute(trx);
    return fn(trx);
  });
}

/**
 * Transaction for queries that touch only public content tables (chunks and
 * friends), which are not RLS-protected and have no user scope.
 */
export async function withTransaction<T>(
  db: AppDatabase,
  fn: (trx: Trx) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(fn);
}
