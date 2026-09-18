import { useCallback, useEffect, useState } from "react";
import { resolveTheme, type ThemeChoice } from "@/shared/utils/theme";

export type { ThemeChoice };

const STORAGE_KEY = "yuru-eigo:theme";

/** Reads the stored choice, tolerating a blocked or empty localStorage. */
function readStored(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "auto") {
      return value;
    }
  } catch {
    // Private mode and blocked site data both throw; the default is fine.
  }
  return "auto";
}

function apply(choice: ThemeChoice, now: Date) {
  document.documentElement.setAttribute(
    "data-theme",
    resolveTheme(choice, now),
  );
}

/**
 * Theme preference, remembered per browser.
 *
 * The three options are all about time of day — 昼 / 夜 / 自動 — so "auto"
 * follows the clock rather than the OS setting: mixing a brightness concept
 * into a set of time words is what made the old wording confusing.
 *
 * Stored in localStorage rather than on the account: it is a per-device
 * display setting, and syncing it would make the app flash the wrong theme
 * while the session loads.
 */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(readStored);

  useEffect(() => {
    apply(choice, new Date());

    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Not being able to remember it is not worth surfacing.
    }

    if (choice !== "auto") return;

    // On "auto" the theme has to change by itself when the clock crosses the
    // boundary, including while the tab sits open overnight.
    const timer = window.setInterval(() => apply(choice, new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [choice]);

  const setTheme = useCallback((next: ThemeChoice) => setChoice(next), []);

  return { theme: choice, setTheme };
}
