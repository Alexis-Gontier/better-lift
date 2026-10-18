import { dossierSaisi, ordreDossiers } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import { type DepotDossiers, NomPris } from "../services/dossiers.js";

const INTROUVABLE = { erreur: "Dossier introuvable." };

/**
 * Les dossiers de routines (D297), derrière une session. Dépôt et lecteur de session sont
 * injectés, comme pour les routines. Le dossier d'autrui est introuvable (404).
 */
export function routesDossiers(depot: DepotDossiers, lireSession: LireSession) {
  return (
    new Hono()
      .use(exigerSession(lireSession))
      // AVANT `/:id` : sinon « ordre » serait pris pour un identifiant.
      .put("/ordre", zValidator("json", ordreDossiers), async (c) => {
        const ok = await depot.ordonner(c.get("userId"), c.req.valid("json").ids);
        return ok ? c.body(null, 204) : c.json(INTROUVABLE, 404);
      })
      .post("/", zValidator("json", dossierSaisi), async (c) => {
        try {
          const id = await depot.creer(c.get("userId"), c.req.valid("json").nom);
          return c.json({ id }, 201);
        } catch (e) {
          if (e instanceof NomPris) return c.json({ erreur: e.message }, 409);
          throw e;
        }
      })
      .patch("/:id", zValidator("json", dossierSaisi), async (c) => {
        const id = c.req.param("id");
        try {
          const ok = await depot.renommer(c.get("userId"), id, c.req.valid("json").nom);
          return ok ? c.json({ id }, 200) : c.json(INTROUVABLE, 404);
        } catch (e) {
          if (e instanceof NomPris) return c.json({ erreur: e.message }, 409);
          throw e;
        }
      })
      .delete("/:id", async (c) => {
        const ok = await depot.supprimer(c.get("userId"), c.req.param("id"));
        return ok ? c.body(null, 204) : c.json(INTROUVABLE, 404);
      })
  );
}
