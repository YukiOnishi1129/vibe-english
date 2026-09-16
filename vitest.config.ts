import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // RLS tests talk to a real Postgres; keep them serial and patient.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
