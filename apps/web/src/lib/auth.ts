import { createAuthClient } from "better-auth/client";
import { URL_AUTH } from "./config";

/**
 * Le client de Better Auth, sans React (D306). `credentials: "include"` : en développement, le
 * web (3000) et l'API (3001) sont deux origines.
 */
export const authClient = createAuthClient({
  baseURL: URL_AUTH,
  fetchOptions: { credentials: "include" },
});

export type Session = typeof authClient.$Infer.Session | null;

/**
 * L'objet passé au contexte du routeur (D301). Il est MUTÉ puis le routeur invalidé, ce qui
 * fait relire `beforeLoad` sans recréer le routeur.
 */
export const auth: { session: Session } = { session: null };

/**
 * Lue AVANT le premier rendu. Une API injoignable vaut « pas de session » : on retombe sur la
 * connexion, qui dira l'échec à la tentative — jamais une page blanche.
 */
export async function chargerSession(): Promise<void> {
  try {
    const { data } = await authClient.getSession();
    auth.session = data ?? null;
  } catch {
    auth.session = null;
  }
}

/** Où revenir après la connexion : un chemin interne seulement, sinon l'Accueil. */
export function cibleApresConnexion(redirect: unknown): string {
  return typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/";
}
