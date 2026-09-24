import type { AppType } from "@better-lift/api";
import { hc } from "hono/client";

/**
 * Le client RPC de l'API, pour les DEUX surfaces (D42).
 *
 * Il vivait dans `apps/web/src/lib/api.ts` jusqu'ici : la conception principale
 * avait reporté ce paquet faute d'un second consommateur, et le lot 4 en fournit
 * un — le mobile lira le même catalogue.
 *
 * L'URL de base reste à l'appelant : elle vient de `import.meta.env` côté web et
 * d'une constante côté mobile, où l'émulateur joint l'API en 10.0.2.2. Un paquet
 * partagé qui lirait `import.meta.env` ne compilerait pas côté Expo.
 *
 * `credentials: "include"` est requis dès que le client et l'API sont sur deux
 * origines — c'est le cas en développement, 3000 contre 3001.
 */
export function creerClient(baseUrl: string) {
  return hc<AppType>(baseUrl, { init: { credentials: "include" } });
}

export type Client = ReturnType<typeof creerClient>;
export type { AppType } from "@better-lift/api";
