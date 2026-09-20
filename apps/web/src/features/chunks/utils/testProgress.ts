/** Where a test was left off, so closing the tab does not lose the answers. */

export type TestProgress = {
  /** Question ids in the order they were asked, so the same test resumes. */
  order: string[];
  index: number;
  correct: number;
  missedChunkIds: string[];
  /** The day it was saved; yesterday's test is not resumed. */
  day: string;
};

const STORAGE_KEY = "yuru-eigo:test-progress";

/** Local calendar day — the session resets with the learner's own date. */
export function today(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function loadTestProgress(day = today()): TestProgress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<TestProgress>;
    if (
      !Array.isArray(parsed.order) ||
      typeof parsed.index !== "number" ||
      typeof parsed.correct !== "number" ||
      !Array.isArray(parsed.missedChunkIds) ||
      parsed.day !== day
    ) {
      return null;
    }

    return {
      order: parsed.order.filter((id): id is string => typeof id === "string"),
      index: parsed.index,
      correct: parsed.correct,
      missedChunkIds: parsed.missedChunkIds.filter(
        (id): id is string => typeof id === "string",
      ),
      day: parsed.day,
    };
  } catch {
    // Blocked storage or malformed JSON: start fresh rather than crash.
    return null;
  }
}

export function saveTestProgress(
  progress: Omit<TestProgress, "day">,
): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...progress, day: today() }),
    );
  } catch {
    // Not being able to remember the position is not worth surfacing.
  }
}

export function clearTestProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
