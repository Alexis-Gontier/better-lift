import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * L'application vit sous `/app` : la racine du site est laissée à la landing (D292). Le routeur
 * porte le même préfixe (`basepath` dans `main.tsx`).
 */
const BASE = "/app/";

export default defineConfig({
  base: BASE,
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  server: { port: 3000 },
});
