import { ApiError } from "@vibe-english/api-client";
import type { Me } from "@vibe-english/domain";
import { api } from "@/shared/api";

/** Query keys for auth. Defined only here — see the ESLint rule. */
export const authKeys = {
  all: () => ["auth"] as const,
  session: () => [...authKeys.all(), "session"] as const,
} as const;

export const sessionQuery = () => ({
  queryKey: authKeys.session(),
  queryFn: (): Promise<Me> => api.getMe(),
  // A signed-out visitor gets a 401 every time; retrying it just delays the
  // login screen.
  retry: (failureCount: number, error: unknown) =>
    !(error instanceof ApiError && error.isUnauthorized) && failureCount < 2,
  staleTime: 5 * 60 * 1000,
});

export const signInWithGoogleRequest = (callbackPath: string): Promise<string> =>
  api.startGoogleSignIn(callbackPath);

export const signOutRequest = (): Promise<unknown> => api.signOut();
