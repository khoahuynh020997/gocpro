import path from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = path.resolve("spa");

export default defineConfig({
  root,
  base: "/gocpro/",
  publicDir: path.resolve("public"),
  envDir: path.resolve("."),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    tsconfigPaths: true,
    alias: { "@": path.resolve("src") },
  },
  define: {
    "import.meta.env.VITE_SPA": JSON.stringify("1"),
  },
  build: {
    outDir: path.resolve("dist-pages"),
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
