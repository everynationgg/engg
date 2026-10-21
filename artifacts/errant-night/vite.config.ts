import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT || "5173";
const port = Number(rawPort);

const basePath = process.env.BASE_PATH || "./";
const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
const apiUrl = (process.env.VITE_API_URL || "https://engg.fly.dev").replace(/\/$/, "");

export default defineConfig({
  base: normalizedBase,
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(`${apiUrl}/api`),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: apiUrl,
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: apiUrl,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
