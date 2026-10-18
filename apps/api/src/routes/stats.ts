import { PERIODES } from "@better-lift/shared";
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

const requetePeriode = z.object({
  fuseau: z.string().max(64).refine(fuseauValide, "Fuseau inconnu.").default("Europe/Paris"),
  periode: z.enum(PERIODES),
});

/**
 * Les statistiques, derrière une session. `GET /stats` et `/stats/exercices` sont partis
 * (D295) ; `/stats/periode` suit au branchement du nouveau web, qui ne le lit plus.
 */
export function routesStats(depot: DepotStats, lireSession: LireSession) {
  return (
    new Hono()
      .use(exigerSession(lireSession))
      // Le bilan de toujours (D128), pour l'en-tête du Profil du mobile.
      .get("/bilan", async (c) => c.json(await depot.bilan(c.get("userId")), 200))
      // Par période (D125) : lu par le tableau de bord du web de production. Le découpage en
      // semaines se fait dans le fuseau du client : le samedi 21 h à Paris est déjà dimanche
      // en UTC.
      .get("/periode", zValidator("query", requetePeriode), async (c) => {
        const { fuseau, periode } = c.req.valid("query");
        return c.json(await depot.lirePeriode(c.get("userId"), new Date(), fuseau, periode), 200);
      })
  );
}
