import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DrillResult } from "@vibe-english/domain";
import {
  chunkDetailQuery,
  chunkKeys,
  completeChunkRequest,
  dailySessionQuery,
  finishChunkRequest,
  hardChunksQuery,
  reviewGroupsQuery,
  setHardFlagRequest,
  todayChunksQuery,
} from "@/features/chunks/queries/chunkQueries";

// Hooks are the only place allowed to touch the queries layer. Containers use
// these; presenters receive plain props.

export function useTodayChunks() {
  return useQuery(todayChunksQuery());
}

export function useDailySession() {
  return useQuery(dailySessionQuery());
}

export function useReviewGroups() {
  return useQuery(reviewGroupsQuery());
}

/** Reports the outcome, then refreshes the queue, streak and review list. */
export function useFinishChunk(chunkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (result: DrillResult) => finishChunkRequest(chunkId, result),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chunkKeys.all() });
    },
  });
}

/**
 * Sends the wrap-up quiz outcome: every missed phrase goes back into review.
 * Correct ones are left untouched so they retire on their own.
 */
export function useRecordQuizMisses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chunkIds: string[]) => {
      await Promise.all(
        chunkIds.map((id) => finishChunkRequest(id, "struggled")),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chunkKeys.all() });
    },
  });
}

export function useChunkDetail(chunkId: string | undefined) {
  return useQuery({
    ...chunkDetailQuery(chunkId ?? ""),
    enabled: Boolean(chunkId),
  });
}

export function useHardChunks() {
  return useQuery(hardChunksQuery());
}

/** Marks a chunk complete and refreshes every view that shows progress. */
export function useCompleteChunk(chunkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completeChunkRequest(chunkId),
    onSuccess: () => {
      // Invalidating the root key covers today, detail and hard at once.
      void queryClient.invalidateQueries({ queryKey: chunkKeys.all() });
    },
  });
}

/**
 * Toggles the hard flag, updating the cached chunk immediately so the button
 * responds without waiting for the round trip.
 */
export function useToggleHardFlag(chunkId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hard: boolean) => setHardFlagRequest(chunkId, hard),
    onMutate: async (hard) => {
      const key = chunkKeys.detail(chunkId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: unknown) =>
        old && typeof old === "object" ? { ...old, isHard: hard } : old,
      );

      return { previous };
    },
    onError: (_error, _hard, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(chunkKeys.detail(chunkId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: chunkKeys.all() });
    },
  });
}
