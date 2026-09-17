/** Ordering helpers for quiz question selection. */

/**
 * Deterministic shuffle from a seed, so a given quiz keeps its order across
 * re-renders instead of reshuffling on every keystroke.
 */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed;

  for (let i = result.length - 1; i > 0; i--) {
    // xorshift: small, dependency-free, and good enough for question order.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const j = Math.abs(state) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
