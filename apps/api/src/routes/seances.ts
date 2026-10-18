import { seanceSaisie } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import { SlugInconnu } from "../services/routines.js";
import type { DepotLectureSeances, DepotSeances } from "../services/seances.js";

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  taille: z.coerce.number().int().min(1).max(100).default(30),
  // Les séances d'une routine (D311) : ses stats se calculent dessus.
  routine: z.string().min(1).max(40).optional(),
});

// « a,b,c » : une liste de slugs dans un seul paramètre d'URL.
const listeSlugs = z.object({
  slugs: z
    .string()
    .transform((s) => [
      ...new Set(
        s
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(z.string().max(200)).min(1).max(50)),
});

/**
 * Les séances, derrière une session (D53).
 *
 * `POST /` est IDEMPOTENT (D56) : rejouer le même identifiant rend 200 sans rien
 * réécrire — la file du mobile compte là-dessus. La lecture (lot 7) dérive tout
 * — volume, séries, records — à chaque appel (D58, D65).
 */
export function routesSeances(
  depot: DepotSeances,
  lecture: DepotLectureSeances,
  lireSession: LireSession,
) {
  return (
    new Hono()
      .use(exigerSession(lireSession))
      .get("/", zValidator("query", pagination), async (c) => {
        const { page, taille, routine } = c.req.valid("query");
        return c.json(
          { ...(await lecture.lister(c.get("userId"), page, taille, routine)), page, taille },
          200,
        );
      })
      // AVANT `/:id` : sinon « precedentes » serait pris pour un identifiant.
      .get("/precedentes", zValidator("query", listeSlugs), async (c) =>
        c.json(await lecture.precedentes(c.get("userId"), c.req.valid("query").slugs), 200),
      )
      .get("/:id", async (c) => {
        const seance = await lecture.lire(c.get("userId"), c.req.param("id"));
        return seance ? c.json(seance, 200) : c.json({ erreur: "Séance introuvable." }, 404);
      })
      .delete("/:id", async (c) => {
        const ok = await depot.supprimer(c.get("userId"), c.req.param("id"));
        return ok ? c.body(null, 204) : c.json({ erreur: "Séance introuvable." }, 404);
      })
      .post("/", zValidator("json", seanceSaisie), async (c) => {
        const saisie = c.req.valid("json");
        try {
          const issue = await depot.enregistrer(c.get("userId"), saisie);
          if (issue === "conflit")
            return c.json({ erreur: "Identifiant de séance déjà pris." }, 409);
          return c.json({ id: saisie.id }, issue === "creee" ? 201 : 200);
        } catch (e) {
          if (e instanceof SlugInconnu) return c.json({ erreur: e.message }, 400);
          throw e;
        }
      })
  );
}
