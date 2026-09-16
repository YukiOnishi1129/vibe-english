import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@vibe-english/api-client";
import type { Me } from "@vibe-english/domain";
import { api } from "./api";

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: Me }
  | { status: "anonymous" };

/** Resolves the session from the httpOnly cookie via GET /api/me. */
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const user = await api.getMe();
      setState({ status: "authenticated", user });
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        setState({ status: "anonymous" });
        return;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, refresh };
}
