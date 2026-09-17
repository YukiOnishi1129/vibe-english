import type {
  Chunk,
  ChunkProgress,
  DailySession,
  DrillResult,
  Me,
  ReviewGroup,
  Streak,
} from "@vibe-english/domain";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

export type ApiClientOptions = {
  /**
   * Prefix for API routes. Web leaves this empty so requests are same-origin
   * relative paths; a future mobile app passes the deployed origin.
   */
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
};

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl?.replace(/\/$/, "") ?? "";
  const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await doFetch(`${baseUrl}${path}`, {
      ...init,
      // Session lives in an httpOnly cookie; it must ride along.
      credentials: "include",
      headers: { Accept: "application/json", ...init?.headers },
    });

    if (!response.ok) {
      const message = await response
        .json()
        .then((body: { error?: string }) => body.error ?? response.statusText)
        .catch(() => response.statusText);
      throw new ApiError(response.status, message);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    getMe: () => request<Me>("/api/me"),

    getTodayChunks: () =>
      request<{ chunks: Chunk[] }>("/api/chunks/today").then((r) => r.chunks),

    getDailySession: () => request<DailySession>("/api/chunks/session"),

    getReviewGroups: () =>
      request<{ groups: ReviewGroup[] }>("/api/review").then((r) => r.groups),

    /** Reports how it went; drives the review list and the streak. */
    finishChunk: (id: string, result: DrillResult) =>
      request<{ progress: ChunkProgress; streak: Streak }>(
        `/api/chunks/${encodeURIComponent(id)}/finish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result }),
        },
      ),

    getChunk: (id: string) =>
      request<Chunk>(`/api/chunks/${encodeURIComponent(id)}`),

    completeChunk: (id: string) =>
      request<{ progress: ChunkProgress }>(
        `/api/chunks/${encodeURIComponent(id)}/complete`,
        { method: "POST" },
      ).then((r) => r.progress),

    setHardFlag: (id: string, hard: boolean) =>
      request<{ isHard: boolean }>(
        `/api/chunks/${encodeURIComponent(id)}/flags/hard`,
        { method: hard ? "POST" : "DELETE" },
      ).then((r) => r.isHard),

    getHardChunks: () =>
      request<{ chunks: Chunk[] }>("/api/flags/hard").then((r) => r.chunks),

    /**
     * Starts Google sign-in. Better Auth's social endpoint is POST-only and
     * answers with the provider URL to send the browser to, so this returns
     * that URL rather than being a link target.
     */
    startGoogleSignIn: (callbackPath = "/") =>
      request<{ url: string; redirect: boolean }>(
        "/api/auth/sign-in/social",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "google", callbackURL: callbackPath }),
        },
      ).then((r) => r.url),

    /** Clears the session cookie. Better Auth requires a JSON body here. */
    signOut: () =>
      request<{ success: boolean }>("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
