import { preferences } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotPreferences } from "../services/preferences.js";

/**
 * Les préférences du compte (D129), derrière une session. L'utilisateur vient
 * de la session, jamais de l'URL : chacun ne lit et n'écrit que les siennes.
 * `PUT` remplace le tout — le client envoie toujours les deux champs.
 */
export function routesPreferences(depot: DepotPreferences, lireSession: LireSession) {
  return new Hono()
    .use(exigerSession(lireSession))
    .get("/", async (c) => c.json(await depot.lire(c.get("userId"))))
    .put("/", zValidator("json", preferences), async (c) =>
      c.json(await depot.ecrire(c.get("userId"), c.req.valid("json"))),
    );
}
