import { creerClient } from "@better-lift/api-client";
import { URL_API } from "./config";

/** L'URL de base est la seule chose propre au web : le client, lui, est partagé. */
export const api = creerClient(URL_API);

/** Un échec d'API : le message de `{ erreur }` et le statut ; 0 : serveur injoignable. */
export class ErreurApi extends Error {
  constructor(
    message: string,
    readonly statut: number,
  ) {
    super(message);
    this.name = "ErreurApi";
  }
}

const INJOIGNABLE = "Le serveur est injoignable. Vérifiez votre connexion, puis réessayez.";

type Reponse = { ok: boolean; status: number; json(): Promise<unknown> };

/**
 * Lance l'appel et rend la réponse si elle est `ok`, rétrécie au type du succès ; lève une
 * `ErreurApi` sinon (D300). Générique pour garder le typage RPC : un `Response` nu ferait de
 * `res.json()` un `any`.
 */
export async function lire<R extends Reponse>(
  appel: () => Promise<R>,
  parDefaut: string,
): Promise<Extract<R, { ok: true }>> {
  let res: R;
  try {
    res = await appel();
  } catch {
    // Le navigateur dit « Failed to fetch », en anglais : l'application est en français.
    throw new ErreurApi(INJOIGNABLE, 0);
  }
  if (!res.ok) {
    const corps = (await res.json().catch(() => null)) as { erreur?: unknown } | null;
    throw new ErreurApi(typeof corps?.erreur === "string" ? corps.erreur : parDefaut, res.status);
  }
  return res as Extract<R, { ok: true }>;
}
