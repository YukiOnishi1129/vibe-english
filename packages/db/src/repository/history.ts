import { sql } from "kysely";
import type { Trx } from "../withUserTransaction";

// user_drill_results is RLS-protected; the surrounding transaction must have
// set app.user_id.

/**
 * The days the learner practised, newest first.
 *
 * Built from drill results rather than user_progress: progress keeps only the
 * most recent completion per chunk, so it cannot answer "which days did I
 * study" once a phrase has been repeated.
 *
 * The timezone offset comes from the client, so a late-evening session counts
 * as that day rather than sliding into tomorrow in UTC.
 */
export async function listPracticeDays(
  trx: Trx,
  userId: string,
  offsetMinutes: number,
  since: string,
) {
  // Written as raw SQL: the shifted date appears in SELECT, GROUP BY and
  // ORDER BY, and Postgres needs those to be the same expression.
  const result = await sql<{ day: string; answers: string }>`
    SELECT
      to_char(local_day, 'YYYY-MM-DD') AS day,
      count(*) AS answers
    FROM (
      SELECT (created_at + make_interval(mins => ${offsetMinutes}))::date AS local_day
      FROM user_drill_results
      WHERE user_id = ${userId}
    ) shifted
    WHERE local_day >= ${since}::date
    GROUP BY local_day
    ORDER BY local_day DESC
  `.execute(trx);

  return result.rows.map((row) => ({
    day: row.day,
    answers: Number(row.answers),
  }));
}
