import { useCallback, useEffect, useState } from "react";

export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "yuru-eigo:theme";

/** Reads the stored choice, tolerating a blocked or empty localStorage. */
function readStored(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    // Private mode and blocked site data both throw; the default is fine.
  }
  return "system";
}

function apply(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

/**
 * Theme preference, remembered per browser.
 *
 * This is a per-device display setting rather than account data, so it stays
 * in localStorage: syncing it to the server would make the app flash the
 * wrong theme while the session loads.
 */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(readStored);

  useEffect(() => {
    apply(choice);
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Not being able to remember it is not worth surfacing.
    }
  }, [choice]);

  const setTheme = useCallback((next: ThemeChoice) => setChoice(next), []);

  return { theme: choice, setTheme };
}
