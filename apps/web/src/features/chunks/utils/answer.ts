/** Answer comparison shared by the practice deck and the wrap-up quiz. */

/**
 * Forgiving match: case, surrounding space and trailing punctuation are
 * ignored, so a right answer is never marked wrong over a full stop.
 */
export function isAnswerCorrect(input: string, answer: string): boolean {
  const normalise = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[.!?,]+$/g, "")
      .replace(/\s+/g, " ");

  return normalise(input) === normalise(answer);
}
