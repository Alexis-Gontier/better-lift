import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotStats } from "../services/stats.js";

/**
 * Les statistiques, derrière une session : le bilan de toujours seul. `GET /stats`,
 * `/stats/exercices` et `/stats/periode` sont partis avec leurs écrans (D295).
 */
export function routesStats(depot: DepotStats, lireSession: LireSession) {
  return (
    new Hono()
      .use(exigerSession(lireSession))
      // Le bilan de toujours (D128), pour l'en-tête du Profil du mobile.
      .get("/bilan", async (c) => c.json(await depot.bilan(c.get("userId")), 200))
  );
}
