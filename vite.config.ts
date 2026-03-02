/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { amdToEsm } from './vite-plugin-amd-to-esm';
import { resolve } from 'path';
import vssExtension from './vss-extension.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Convert AMD modules from azure-devops-extension-api to ESM
    // This custom plugin transforms define() calls into import/export statements
    // Path resolution for relative imports is handled inside the plugin
    amdToEsm({
      include: /azure-devops-extension-api/,
    }),
  ],
  root: 'src',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'es',
      },
    },
  },
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(vssExtension.version),
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    // Exclude azure-devops-extension-api from pre-bundling
    // The amdToEsm Vite plugin will handle AMD→ESM conversion during transform phase
    // This works because the plugin converts relative imports to package-absolute paths
    exclude: ['azure-devops-extension-api'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: '../tests/setup.ts',
    css: true,
    root: '..',
  },
});
