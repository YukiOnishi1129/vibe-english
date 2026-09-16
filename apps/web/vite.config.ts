import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production: one Cloudflare Worker serves both the API (/api/*) and the
// React build (everything else), so session cookies stay same-origin.
// Local dev: Vite (5173) proxies /api to the Worker dev server (8787).
export default defineConfig({
  plugins: [react()],
  build: {
    // The API Worker serves this directory as its static assets, so both the
    // React app and /api/* ship from one origin.
    outDir: "../api/dist/client",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: false,
      },
    },
  },
});
