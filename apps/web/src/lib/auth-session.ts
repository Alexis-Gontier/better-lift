import { authClient, type Session } from "./auth-client";

/**
 * L'objet passé au contexte du routeur. Il est MUTÉ puis le routeur invalidé,
 * ce qui fait relire `beforeLoad` sans recréer le routeur.
 *
 * Il vit ici et non dans `main.tsx` : `main.tsx` importe `routeTree.gen`, qui
 * importe les routes — une route qui importerait `main.tsx` fermerait un cycle,
 * et la fonction pourrait valoir `undefined` au moment de l'appel.
 */
export const auth = { session: null as Session };

export async function loadSession(): Promise<void> {
  // `main.tsx` attend cette fonction AVANT le premier rendu. Si elle rejetait —
  // API injoignable, réseau coupé —, l'application ne se rendrait jamais : une
  // page blanche, sans un mot. Une API injoignable se traite donc comme « pas de
  // session » : on retombe sur la connexion, qui dira l'échec à la tentative.
  try {
    const { data } = await authClient.getSession();
    auth.session = data ?? null;
  } catch {
    auth.session = null;
  }
}
