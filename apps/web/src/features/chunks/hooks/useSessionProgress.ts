import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  clearProgress,
  loadProgress,
  type SessionProgress,
} from "@/features/chunks/utils/progress";

const CHANGED = "yuru-eigo:session-progress-changed";

/**
 * Reads the saved position without owning a session.
 *
 * The intro screen needs to know whether there is something to resume, but it
 * does not run the deck; keeping this separate stops it from touching the
 * session's own state.
 */
export function useSessionProgress() {
  const { key } = useLocation();
  const [progress, setProgress] = useState<SessionProgress | null>(() =>
    loadProgress(),
  );

  useEffect(() => {
    // Re-read on mount as well: navigating back here does not remount the
    // module, and the deck may have moved on since the last render.
    const sync = () => setProgress(loadProgress());
    sync();

    window.addEventListener("storage", sync);
    window.addEventListener(CHANGED, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGED, sync);
    };
    // `key` changes on every navigation, so coming back from the deck
    // re-reads the position the deck just saved.
  }, [key]);

  const reset = useCallback(() => {
    clearProgress();
    setProgress(null);
    // Storage events do not fire in the tab that made the change.
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  return { progress, reset };
}
