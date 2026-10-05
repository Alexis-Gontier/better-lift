import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotStats } from "../services/stats.js";

/** Un fuseau IANA que le moteur connaît : un fuseau inventé fausserait tout le découpage. */
const fuseauValide = (f: string) => {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: f });
    return true;
  } catch {
    return false;
  }
};

const requete = z.object({
  fuseau: z.string().max(64).refine(fuseauValide, "Fuseau inconnu.").default("Europe/Paris"),
});

/**
 * Les statistiques (D112), derrière une session. Le découpage en semaines se fait
 * dans le fuseau du client : le samedi 21 h à Paris est déjà dimanche en UTC.
 */
export function routesStats(depot: DepotStats, lireSession: LireSession) {
  return new Hono()
    .use(exigerSession(lireSession))
    .get("/", zValidator("query", requete), async (c) =>
      c.json(await depot.lire(c.get("userId"), new Date(), c.req.valid("query").fuseau)),
    );
}
