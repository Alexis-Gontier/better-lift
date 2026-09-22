import type { AppType } from "@better-lift/api";
import { hc } from "hono/client";

/**
 * `credentials: "include"` est requis dès que le client et l'API sont sur
 * deux origines — c'est le cas en développement (3000 contre 3001).
 */
export const api = hc<AppType>(import.meta.env.VITE_API_URL ?? "http://localhost:3001", {
  init: { credentials: "include" },
});
