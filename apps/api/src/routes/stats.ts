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

const requete = z.object({
  fuseau: z.string().max(64).refine(fuseauValide, "Fuseau inconnu.").default("Europe/Paris"),
});

const requetePeriode = requete.extend({ periode: z.enum(PERIODES) });

/**
 * Les statistiques (D112), derrière une session. Le découpage en semaines se fait
 * dans le fuseau du client : le samedi 21 h à Paris est déjà dimanche en UTC.
 */
export function routesStats(depot: DepotStats, lireSession: LireSession) {
  return (
    new Hono()
      .use(exigerSession(lireSession))
      .get("/", zValidator("query", requete), async (c) =>
        c.json(await depot.lire(c.get("userId"), new Date(), c.req.valid("query").fuseau)),
      )
      // Le bilan de toujours (D128), pour l'en-tête du Profil.
      .get("/bilan", async (c) => c.json(await depot.bilan(c.get("userId"))))
      // Par période (D125) : une route à part, `GET /stats` garde sa forme pour le web.
      .get("/periode", zValidator("query", requetePeriode), async (c) => {
        const { fuseau, periode } = c.req.valid("query");
        return c.json(await depot.lirePeriode(c.get("userId"), new Date(), fuseau, periode));
      })
      // « Tes exercices » de l'onglet Progrès (D173).
      .get("/exercices", zValidator("query", requetePeriode), async (c) => {
        const { fuseau, periode } = c.req.valid("query");
        return c.json(await depot.lireExercices(c.get("userId"), new Date(), fuseau, periode));
      })
  );
}
