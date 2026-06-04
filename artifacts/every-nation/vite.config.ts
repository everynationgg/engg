import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const DEFAULT_API_URL = "https://engg.fly.dev";

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");
  const rawPort = env.PORT || process.env.PORT || "5173";
  const port = Number(rawPort);
  const basePath = env.BASE_PATH || process.env.BASE_PATH || "/";
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL || DEFAULT_API_URL;

  return {
    base: basePath,
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    },
    plugins: [
      react() as any,
      tailwindcss() as any,
      runtimeErrorOverlay() as any,
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              (m as any).cartographer({
                root: path.resolve(import.meta.dirname, ".."),
              }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              (m as any).devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("vite/preload-helper") || id.startsWith("\0vite/")) {
              return "vendor";
            }
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
              return "react-vendor";
            }
            if (
              id.includes("node_modules/three") ||
              id.includes("node_modules/@react-three")
            ) {
              return "three-vendor";
            }
            if (id.includes("node_modules/framer-motion")) {
              return "motion-vendor";
            }
            if (id.includes("node_modules/@radix-ui")) {
              return "radix-vendor";
            }
            if (
              id.includes("node_modules/wouter") ||
              id.includes("node_modules/use-sync-external-store")
            ) {
              return "vendor";
            }
          },
        },
      },
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
