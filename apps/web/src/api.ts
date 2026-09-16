import { createApiClient } from "@vibe-english/api-client";

// Same origin in production; Vite proxies /api to the Worker in dev.
export const api = createApiClient();
