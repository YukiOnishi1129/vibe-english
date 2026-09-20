/** Where a session was left off, so closing the tab does not lose the place. */

export type SessionProgress = {
  stepIndex: number;
  cardIndex: number;
  /** Set once every step has been worked through. */
  practiceDone: boolean;
  /** The day it was saved, so yesterday's position is not restored. */
  day: string;
};

const STORAGE_KEY = "yuru-eigo:session-progress";

/** Local calendar day — the session resets with the learner's own date. */
export function today(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function loadProgress(day = today()): SessionProgress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SessionProgress>;
    if (
      typeof parsed.stepIndex !== "number" ||
      typeof parsed.cardIndex !== "number" ||
      parsed.day !== day
    ) {
      return null;
    }

    return {
      stepIndex: parsed.stepIndex,
      cardIndex: parsed.cardIndex,
      practiceDone: parsed.practiceDone === true,
      day: parsed.day,
    };
  } catch {
    // Blocked storage or malformed JSON: start fresh rather than crash.
    return null;
  }
}

export function saveProgress(
  stepIndex: number,
  cardIndex: number,
  practiceDone = false,
) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ stepIndex, cardIndex, practiceDone, day: today() }),
    );
  } catch {
    // Not being able to remember the position is not worth surfacing.
  }
}

export function clearProgress() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
