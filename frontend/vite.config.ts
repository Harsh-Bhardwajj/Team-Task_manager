import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const envDir = path.resolve(import.meta.dirname, "..");

const rawPort = process.env.PORT;
const basePath = process.env.BASE_PATH;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");
  const envPort = env.FRONTEND_PORT ?? env.PORT ?? rawPort;
  const envBasePath = env.BASE_PATH ?? basePath;

  if (!envPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const resolvedPort = Number(envPort);
  if (Number.isNaN(resolvedPort) || resolvedPort <= 0) {
    throw new Error(`Invalid PORT value: "${envPort}"`);
  }

  if (!envBasePath) {
    throw new Error(
      "BASE_PATH environment variable is required but was not provided.",
    );
  }

  return {
    envDir,
    base: envBasePath,
    plugins: [react(), tailwindcss({ optimize: false })],
    server: {
      port: resolvedPort,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
      proxy: {
        "/api": {
          target: env.BACKEND_URL ?? "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    preview: {
      port: resolvedPort,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
