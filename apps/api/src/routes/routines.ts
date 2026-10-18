import { deplacementRoutine, ordreRoutines, routineSaisie } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotDossiers } from "../services/dossiers.js";
import { type DepotRoutines, DossierInconnu, SlugInconnu } from "../services/routines.js";

const INTROUVABLE = { erreur: "Routine introuvable." };

/**
 * Les routes des routines, toutes derrière une session (D53).
 *
 * Dépôt et lecteur de session sont INJECTÉS — `app.ts` branche les vrais : les
 * tests montent ces routes sans base ni Better Auth. La routine d'un autre est
 * introuvable (404), jamais interdite (403) : on ne révèle pas qu'elle existe. Un dossier
 * d'autrui aussi, même donné comme `dossierId` (D297).
 */
export function routesRoutines(
  depot: DepotRoutines,
  dossiers: DepotDossiers,
  lireSession: LireSession,
) {
  return (
    new Hono()
      .use(exigerSession(lireSession))
      // Les routines et leurs dossiers en une lecture : la liste les range ensemble (D297).
      .get("/", async (c) => {
        const userId = c.get("userId");
        const [routines, listeDossiers] = await Promise.all([
          depot.lister(userId),
          dossiers.lister(userId),
        ]);
        return c.json({ routines, dossiers: listeDossiers }, 200);
      })
      // AVANT `/:id` : sinon « ordre » serait pris pour un identifiant.
      .put("/ordre", zValidator("json", ordreRoutines), async (c) => {
        const ok = await depot.ordonner(c.get("userId"), c.req.valid("json").ids);
        return ok ? c.body(null, 204) : c.json(INTROUVABLE, 404);
      })
      .get("/:id", async (c) => {
        const routine = await depot.lire(c.get("userId"), c.req.param("id"));
        return routine ? c.json(routine, 200) : c.json(INTROUVABLE, 404);
      })
      .post("/", zValidator("json", routineSaisie), async (c) => {
        try {
          const id = await depot.creer(c.get("userId"), c.req.valid("json"));
          return c.json({ id }, 201);
        } catch (e) {
          if (e instanceof SlugInconnu) return c.json({ erreur: e.message }, 400);
          if (e instanceof DossierInconnu) return c.json({ erreur: e.message }, 404);
          throw e;
        }
      })
      .put("/:id", zValidator("json", routineSaisie), async (c) => {
        const id = c.req.param("id");
        try {
          const ok = await depot.remplacer(c.get("userId"), id, c.req.valid("json"));
          return ok ? c.json({ id }, 200) : c.json(INTROUVABLE, 404);
        } catch (e) {
          if (e instanceof SlugInconnu) return c.json({ erreur: e.message }, 400);
          if (e instanceof DossierInconnu) return c.json({ erreur: e.message }, 404);
          throw e;
        }
      })
      // Ranger ailleurs, sans renvoyer toute la routine (D297).
      .patch("/:id", zValidator("json", deplacementRoutine), async (c) => {
        const id = c.req.param("id");
        try {
          const ok = await depot.deplacer(c.get("userId"), id, c.req.valid("json").dossierId);
          return ok ? c.json({ id }, 200) : c.json(INTROUVABLE, 404);
        } catch (e) {
          if (e instanceof DossierInconnu) return c.json({ erreur: e.message }, 404);
          throw e;
        }
      })
      .delete("/:id", async (c) => {
        const ok = await depot.supprimer(c.get("userId"), c.req.param("id"));
        return ok ? c.body(null, 204) : c.json(INTROUVABLE, 404);
      })
  );
}
