import { createAuthClient } from "better-auth/react";
import { URL_AUTH } from "./config";

/**
 * `credentials: "include"` est requis tant que le client et l'API sont sur deux
 * origines — c'est le cas en développement (3000 contre 3001). En production,
 * le SPA et l'API partagent une origine et il n'y a pas de CORS.
 */
export const authClient = createAuthClient({
  baseURL: URL_AUTH,
  fetchOptions: { credentials: "include" },
});

export type Session = typeof authClient.$Infer.Session | null;
