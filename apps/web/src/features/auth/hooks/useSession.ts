import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@vibe-english/api-client";
import type { Me } from "@vibe-english/domain";
import {
  authKeys,
  sessionQuery,
  signInWithGoogleRequest,
  signOutRequest,
} from "@/features/auth/queries/authQueries";

export type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: Me }
  | { status: "anonymous" };

/**
 * Resolves the session from the httpOnly cookie. A 401 is a normal answer
 * (nobody is signed in), not an error, so it maps to "anonymous".
 */
export function useSession(): SessionState {
  const { data, isPending, error } = useQuery(sessionQuery());

  if (isPending) return { status: "loading" };
  if (error instanceof ApiError && error.isUnauthorized) {
    return { status: "anonymous" };
  }
  if (!data) return { status: "anonymous" };

  return { status: "authenticated", user: data };
}

/** Starts the Google flow by navigating to the URL the server returns. */
export function useGoogleSignIn() {
  const mutation = useMutation({
    mutationFn: () => signInWithGoogleRequest("/"),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  return {
    signIn: () => mutation.mutate(),
    // Stays true through the redirect, so the button keeps its busy state.
    busy: mutation.isPending || mutation.isSuccess,
    failed: mutation.isError,
  };
}

export function useSignOut(onSignedOut?: () => void) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: signOutRequest,
    onSuccess: async () => {
      // Remove everything except the session query, then refetch that one.
      // clear() would also detach the active observers, leaving the screen
      // showing stale data with nothing left to trigger a refetch.
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== authKeys.all()[0],
      });
      await queryClient.refetchQueries({ queryKey: authKeys.session() });
      onSignedOut?.();
    },
  });

  return {
    signOut: () => mutation.mutate(),
    signingOut: mutation.isPending,
    failed: mutation.isError,
  };
}
