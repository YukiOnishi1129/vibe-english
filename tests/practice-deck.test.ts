/**
 * Deck rules that are easy to break silently: the answer key comparison and
 * when a chunk counts as "struggled".
 */
import { describe, expect, it } from "vitest";

/** Mirrors isCorrect() in PracticeCard.tsx. */
function normalise(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.!?,]+$/g, "")
    .replace(/\s+/g, " ");
}

const isCorrect = (input: string, answer: string) =>
  normalise(input) === normalise(answer);

describe("typed drill grading", () => {
  it("accepts the exact answer", () => {
    expect(isCorrect("get", "get")).toBe(true);
  });

  it("ignores case, padding and trailing punctuation", () => {
    expect(isCorrect("  GET ", "get")).toBe(true);
    expect(isCorrect("Can I get a receipt?", "Can I get a receipt")).toBe(true);
    expect(isCorrect("can i  get  this", "Can I get this")).toBe(true);
  });

  it("rejects a different word", () => {
    expect(isCorrect("take", "get")).toBe(false);
    expect(isCorrect("", "get")).toBe(false);
  });
});

describe("struggled outcome", () => {
  /** Mirrors the deck's rule: any wrong answer sends the chunk to review. */
  const outcome = (missed: Set<string>) =>
    missed.size > 0 ? "struggled" : "got_it";

  it("is got_it when nothing was missed", () => {
    expect(outcome(new Set())).toBe("got_it");
  });

  it("is struggled when any drill was wrong", () => {
    expect(outcome(new Set(["d1"]))).toBe("struggled");
  });

  it("clears once the same drill is answered correctly", () => {
    const missed = new Set(["d1"]);
    missed.delete("d1");
    expect(outcome(missed)).toBe("got_it");
  });
});
