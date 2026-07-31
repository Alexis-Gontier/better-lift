/** Route servie après une connexion réussie quand aucune destination n'est demandée. */
export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

/**
 * Nettoie le paramètre `next` posé par `proxy.ts` avant de rediriger dessus.
 *
 * Ce paramètre vient de l'URL, donc de n'importe qui : un lien
 * `/login?next=https://exemple.test` transformerait l'écran de connexion en
 * tremplin de redirection ouverte, et le domaine d'arrivée hériterait de la
 * confiance visuelle du nôtre — c'est le schéma classique du hameçonnage par
 * redirection.
 *
 * Seuls les chemins internes sont donc acceptés :
 *
 *   - il doit commencer par `/` — ce qui écarte `https://…` et `javascript:` ;
 *   - mais pas par `//` ni `/\`, que les navigateurs interprètent comme une URL
 *     relative au protocole, donc comme un domaine externe.
 *
 * Tout le reste retombe sur le tableau de bord.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next?.startsWith("/")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  if (next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AUTHENTICATED_ROUTE;
  }

  return next;
}
