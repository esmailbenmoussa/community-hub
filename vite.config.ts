/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { amdToEsm } from "./vite-plugin-amd-to-esm";
import { resolve } from "path";
import vssExtension from "./vss-extension.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Convert AMD modules from azure-devops-extension-api to ESM
    // This custom plugin transforms define() calls into import/export statements
    amdToEsm({
      // Only process AMD files from the ADO API package
      include: /azure-devops-extension-api/,
      // Rewire module paths for proper resolution
      rewire: (moduleId: string, _parentPath: string) => {
        // Keep azure-devops-extension-sdk as-is (it has ESM exports)
        if (moduleId === "azure-devops-extension-sdk") {
          return "azure-devops-extension-sdk";
        }
        // whatwg-fetch is a regular npm package
        if (moduleId === "whatwg-fetch") {
          return "whatwg-fetch";
        }
        // For relative paths within azure-devops-extension-api, resolve them
        if (moduleId.startsWith("./") || moduleId.startsWith("../")) {
          return moduleId;
        }
        // For other module IDs, assume they're relative to the package
        return "./" + moduleId;
      },
    }),
  ],
  root: "src",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src/index.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        format: "es",
      },
    },
  },
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(vssExtension.version),
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "../tests/setup.ts",
    css: true,
    root: "..",
  },
});
