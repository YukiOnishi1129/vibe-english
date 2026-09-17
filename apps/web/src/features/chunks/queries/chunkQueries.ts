import type { Chunk, ChunkProgress } from "@vibe-english/domain";
import { api } from "@/shared/api";

/**
 * The single source of truth for chunk query keys.
 *
 * Keys are never written inline elsewhere — an ESLint rule enforces that, so
 * an invalidate can never miss a cache entry because someone spelled the key
 * differently. Always go through this factory.
 */
export const chunkKeys = {
  /** Root key: invalidating this clears every chunk-derived cache entry. */
  all: () => ["chunks"] as const,
  today: () => [...chunkKeys.all(), "today"] as const,
  detail: (chunkId: string) => [...chunkKeys.all(), "detail", chunkId] as const,
  hard: () => [...chunkKeys.all(), "hard"] as const,
} as const;

// Query options and mutation functions live here too, so components and hooks
// never reach for the HTTP client directly.

export const todayChunksQuery = () => ({
  queryKey: chunkKeys.today(),
  queryFn: (): Promise<Chunk[]> => api.getTodayChunks(),
});

export const chunkDetailQuery = (chunkId: string) => ({
  queryKey: chunkKeys.detail(chunkId),
  queryFn: (): Promise<Chunk> => api.getChunk(chunkId),
});

export const hardChunksQuery = () => ({
  queryKey: chunkKeys.hard(),
  queryFn: (): Promise<Chunk[]> => api.getHardChunks(),
});

export const completeChunkRequest = (chunkId: string): Promise<ChunkProgress> =>
  api.completeChunk(chunkId);

export const setHardFlagRequest = (
  chunkId: string,
  hard: boolean,
): Promise<boolean> => api.setHardFlag(chunkId, hard);
