/** Theme selection, expressed in times of day. */

export type ThemeChoice = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

/** Night starts at this hour and runs until NIGHT_ENDS_HOUR the next morning. */
export const NIGHT_STARTS_HOUR = 18;
export const NIGHT_ENDS_HOUR = 6;

/**
 * Turns a choice into the theme to apply.
 *
 * "auto" follows the clock rather than the OS colour scheme: the options are
 * named after times of day (昼 / 夜 / 自動), so following the hour is what the
 * wording promises.
 */
export function resolveTheme(choice: ThemeChoice, now: Date): ResolvedTheme {
  if (choice !== "auto") return choice;

  const hour = now.getHours();
  return hour >= NIGHT_STARTS_HOUR || hour < NIGHT_ENDS_HOUR ? "dark" : "light";
}
