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

export async function chargerSession(): Promise<void> {
  const { data } = await authClient.getSession();
  auth.session = data ?? null;
}
