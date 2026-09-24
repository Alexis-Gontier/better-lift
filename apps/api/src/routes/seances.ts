import { seanceSaisie } from "@better-lift/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import { SlugInconnu } from "../services/routines.js";
import type { DepotSeances } from "../services/seances.js";

/**
 * L'envoi d'une séance, derrière une session (D53).
 *
 * IDEMPOTENT (D56) : rejouer le même identifiant rend 200 sans rien réécrire.
 * La file du mobile compte là-dessus pour renvoyer sans risque de doublon.
 * 409 si l'identifiant appartient à quelqu'un d'autre — une collision que le
 * client ne doit jamais provoquer, et qu'on ne résout pas en écrasant.
 */
export function routesSeances(depot: DepotSeances, lireSession: LireSession) {
  return new Hono()
    .use(exigerSession(lireSession))
    .post("/", zValidator("json", seanceSaisie), async (c) => {
      const saisie = c.req.valid("json");
      try {
        const issue = await depot.enregistrer(c.get("userId"), saisie);
        if (issue === "conflit") return c.json({ erreur: "Identifiant de séance déjà pris." }, 409);
        return c.json({ id: saisie.id }, issue === "creee" ? 201 : 200);
      } catch (e) {
        if (e instanceof SlugInconnu) return c.json({ erreur: e.message }, 400);
        throw e;
      }
    });
}
