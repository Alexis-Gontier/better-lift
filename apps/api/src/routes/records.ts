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
  return (
    new Hono()
      // « Mes exercices » (D205) : ce que l'utilisateur a pratiqué. Monté AVANT le catalogue,
      // dont le `/:slug` prendrait sinon « pratiques » pour un exercice inconnu.
      .get("/pratiques", exigerSession(lireSession), async (c) =>
        c.json({ pratiques: await lecture.pratiques(c.get("userId")) }),
      )
      .get("/:slug/records", exigerSession(lireSession), async (c) => {
        const records = await lecture.records(c.get("userId"), c.req.param("slug"));
        return records ? c.json({ records }) : c.json({ erreur: "Exercice introuvable." }, 404);
      })
      // L'historique d'un exercice, pour sa fiche (D124) : séances et séries.
      .get("/:slug/historique", exigerSession(lireSession), async (c) => {
        const seances = await lecture.historiqueExercice(c.get("userId"), c.req.param("slug"));
        return seances ? c.json({ seances }) : c.json({ erreur: "Exercice introuvable." }, 404);
      })
  );
}
