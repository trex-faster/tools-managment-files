import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// El código fuente vive en ./ui y se compila a ./dist, que es exactamente
// lo que tauri.conf.json ya consume (distDir: "../dist"). No hace falta
// tocar src-tauri.
export default defineConfig({
  root: "ui",
  base: "./",
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./ui/src", import.meta.url)) },
  },
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    target: ["es2021", "chrome105", "safari13"],
  },
});
