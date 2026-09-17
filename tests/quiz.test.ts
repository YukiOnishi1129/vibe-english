/** Wrap-up quiz selection rules. */
import { describe, expect, it } from "vitest";
import { seededShuffle } from "../apps/web/src/features/chunks/utils/shuffle";

describe("seededShuffle", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];

  it("keeps every element", () => {
    expect([...seededShuffle(items, 42)].sort((a, b) => a - b)).toEqual(items);
  });

  it("is stable for the same seed", () => {
    expect(seededShuffle(items, 42)).toEqual(seededShuffle(items, 42));
  });

  it("varies across seeds", () => {
    const orders = new Set(
      [1, 7, 13, 99, 1234].map((seed) => seededShuffle(items, seed).join(",")),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("copes with empty and single-item lists", () => {
    expect(seededShuffle([], 5)).toEqual([]);
    expect(seededShuffle(["only"], 5)).toEqual(["only"]);
  });
});
