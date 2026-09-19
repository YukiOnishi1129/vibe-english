/** Helpers for the build-the-sentence step. */

/**
 * Shuffles the word groups so the answer is not simply the given order.
 *
 * Seeded by the drill id so the tiles keep their positions across re-renders —
 * a fresh shuffle on every tap would move the buttons under the finger.
 */
export function shufflePieces(pieces: string[], seed: string): string[] {
  const result = pieces.map((piece, index) => ({ piece, index }));
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) | 0;
  }

  for (let i = result.length - 1; i > 0; i--) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const j = Math.abs(state) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  // A shuffle that happens to land on the original order gives the answer
  // away, so nudge it.
  const unchanged = result.every((item, index) => item.index === index);
  if (unchanged && result.length > 1) {
    [result[0], result[1]] = [result[1], result[0]];
  }

  return result.map((item) => item.piece);
}

/** Joins the chosen groups the way the answer is written. */
export function joinPieces(pieces: string[]): string {
  return pieces.join(" ").replace(/\s+/g, " ").trim();
}
