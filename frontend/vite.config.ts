import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// API requests are proxied to the FastAPI backend during development so the
// frontend can call "/api/..." with no CORS friction.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // Backend runs on 8080 (port 8000 is intentionally left free).
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
