/** Wrap-up quiz selection rules. */
import { describe, expect, it } from "vitest";
import { buildQuiz, QUIZ_LENGTH } from "../apps/web/src/features/chunks/hooks/useWrapUpQuiz";
import type { Chunk } from "@vibe-english/domain";

function chunk(id: string): Chunk {
  return {
    id,
    phrase: `${id} phrase`,
    meaningJa: "意味",
    situation: "",
    nuance: "",
    level: "A1",
    sortOrder: 10,
    examples: [],
    drills: [
      { id: `${id}-blank`, type: "blank", prompt: "a ___ b", answer: "x" },
      { id: `${id}-tr`, type: "translate", prompt: "日本語", answer: "English" },
    ],
    progress: null,
    isHard: false,
    needsReview: false,
  };
}

const five = ["c1", "c2", "c3", "c4", "c5"].map(chunk);

describe("buildQuiz", () => {
  it("asks a fixed number of questions", () => {
    expect(buildQuiz(five, 12345)).toHaveLength(QUIZ_LENGTH);
  });

  it("covers every chunk before repeating one", () => {
    const ids = buildQuiz(five, 999).map((question) => question.chunkId);
    expect(new Set(ids).size).toBe(five.length);
  });

  it("mixes both drill types across seeds", () => {
    const types = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
        buildQuiz(five, seed).map((question) => question.drill.type),
      ),
    );
    expect(types).toEqual(new Set(["blank", "translate"]));
  });

  it("is stable for the same seed and varies across seeds", () => {
    const a = buildQuiz(five, 42).map((q) => q.drill.id);
    const b = buildQuiz(five, 42).map((q) => q.drill.id);
    expect(a).toEqual(b);

    const orders = new Set(
      [1, 7, 13, 99].map((seed) =>
        buildQuiz(five, seed).map((q) => q.drill.id).join(","),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("copes with fewer chunks than the quiz length", () => {
    expect(buildQuiz([chunk("only")], 5)).toHaveLength(2);
    expect(buildQuiz([], 5)).toHaveLength(0);
  });
});
