import { creerClient } from "@better-lift/api-client";
import { authClient } from "./auth-client";
import { URL_API } from "./config";

/**
 * Le client d'API du mobile. Le cookie de session de Better Auth est posé à la
 * main sur chaque requête : il n'y a pas de navigateur pour le faire.
 *
 * `getCookie()` est ASYNCHRONE : sans `await`, l'en-tête partirait sous la
 * forme « [object Promise] » et chaque requête répondrait 401.
 */
export const api = creerClient(URL_API, async (): Promise<Record<string, string>> => {
  const cookie = await authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
});
