import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub project pages: set VITE_PAGES_BASE=/repo-name/ in CI; '/' for user/org root site
const base =
  process.env.VITE_PAGES_BASE ?? process.env.BASE_PATH ?? "/";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: base.endsWith("/") ? base : `${base}/`,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
