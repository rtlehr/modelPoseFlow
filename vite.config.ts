import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  // ensure relative asset paths
  base: "./",

  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    // only load cartographer in dev on Replit
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  // your source root (where index.html lives)
  root: path.resolve(import.meta.dirname, "client"),

  build: {
    // output into a top‑level `www/` folder for Capacitor
    outDir: path.resolve(import.meta.dirname, "www"),
    emptyOutDir: true,
  },
});
