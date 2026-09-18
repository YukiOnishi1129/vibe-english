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
 * `today` is the learner's own calendar day, passed in rather than taken from
 * the database: the server runs in UTC, so after 09:00 UTC a user in Japan is
 * already on the next date and `current_date` would credit the wrong day.
 *
 * The comparison still happens in SQL, so two requests on the same day cannot
 * double-count.
 */
export async function touchStreak(trx: Trx, userId: string, today: string) {
  return trx
    .insertInto("user_streaks")
    .values({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_practiced_on: sql<Date>`${today}::date`,
    })
    .onConflict((oc) =>
      oc.column("user_id").doUpdateSet({
        current_streak: sql<number>`
          CASE
            WHEN user_streaks.last_practiced_on = ${today}::date
              THEN user_streaks.current_streak
            WHEN user_streaks.last_practiced_on = ${today}::date - 1
              THEN user_streaks.current_streak + 1
            ELSE 1
          END`,
        longest_streak: sql<number>`
          GREATEST(
            user_streaks.longest_streak,
            CASE
              WHEN user_streaks.last_practiced_on = ${today}::date
                THEN user_streaks.current_streak
              WHEN user_streaks.last_practiced_on = ${today}::date - 1
                THEN user_streaks.current_streak + 1
              ELSE 1
            END)`,
        last_practiced_on: sql<Date>`${today}::date`,
        updated_at: sql<Date>`now()`,
      }),
    )
    .returning(["current_streak", "longest_streak", "last_practiced_on"])
    .executeTakeFirstOrThrow();
}
