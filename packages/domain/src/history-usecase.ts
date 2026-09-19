import {
  withUserTransaction,
  historyRepo,
  type AppDatabase,
} from "@vibe-english/db";
import type { PracticeDay } from "./types";

/** How far back the calendar looks. */
const DEFAULT_DAYS = 90;

/**
 * The days the learner actually practised.
 *
 * The client passes its own UTC offset so days are counted in local time —
 * an evening session in Japan would otherwise land on the following UTC date.
 */
export async function getPracticeHistory(
  db: AppDatabase,
  userId: string,
  offsetMinutes: number,
  days = DEFAULT_DAYS,
): Promise<PracticeDay[]> {
  const since = new Date();
  since.setMinutes(since.getMinutes() + offsetMinutes);
  since.setDate(since.getDate() - days);

  const sinceDay = since.toISOString().slice(0, 10);

  return withUserTransaction(db, userId, (trx) =>
    historyRepo.listPracticeDays(trx, userId, offsetMinutes, sinceDay),
  );
}
