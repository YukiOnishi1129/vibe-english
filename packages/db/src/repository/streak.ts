import { sql } from "kysely";
import type { Trx } from "../withUserTransaction";

// user_streaks is RLS-protected; see the note in drillResult.ts.

export async function findStreak(trx: Trx, userId: string) {
  return trx
    .selectFrom("user_streaks")
    .select(["current_streak", "longest_streak", "last_practiced_on"])
    .where("user_id", "=", userId)
    .executeTakeFirst();
}

/**
 * Records practice for today and rolls the streak forward.
 *
 * The decision is made in SQL against the database's own current_date, so two
 * requests on the same day cannot double-count, and a client with a wrong
 * clock cannot inflate the streak.
 */
export async function touchStreak(trx: Trx, userId: string) {
  return trx
    .insertInto("user_streaks")
    .values({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_practiced_on: sql<Date>`current_date`,
    })
    .onConflict((oc) =>
      oc.column("user_id").doUpdateSet({
        current_streak: sql<number>`
          CASE
            WHEN user_streaks.last_practiced_on = current_date
              THEN user_streaks.current_streak
            WHEN user_streaks.last_practiced_on = current_date - 1
              THEN user_streaks.current_streak + 1
            ELSE 1
          END`,
        longest_streak: sql<number>`
          GREATEST(
            user_streaks.longest_streak,
            CASE
              WHEN user_streaks.last_practiced_on = current_date
                THEN user_streaks.current_streak
              WHEN user_streaks.last_practiced_on = current_date - 1
                THEN user_streaks.current_streak + 1
              ELSE 1
            END)`,
        last_practiced_on: sql<Date>`current_date`,
        updated_at: sql<Date>`now()`,
      }),
    )
    .returning(["current_streak", "longest_streak", "last_practiced_on"])
    .executeTakeFirstOrThrow();
}
