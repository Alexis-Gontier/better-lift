import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotLectureSeances } from "../services/seances.js";

/**
 * Les records d'un exercice, montés sous `/exercices` à côté du catalogue.
 *
 * La garde de session est posée sur CETTE route seulement : un `.use()` sur le
 * sous-arbre s'appliquerait à tout `/exercices/*` — et fermerait le catalogue,
 * qui est public (lot 4).
 */
export function routesRecords(lecture: DepotLectureSeances, lireSession: LireSession) {
  return new Hono().get("/:slug/records", exigerSession(lireSession), async (c) => {
    const records = await lecture.records(c.get("userId"), c.req.param("slug"));
    return records ? c.json({ records }) : c.json({ erreur: "Exercice introuvable." }, 404);
  });
}
