import { versCsv } from "@better-lift/shared";
import { Hono } from "hono";
import { exigerSession, type LireSession } from "../middlewares/session.js";
import type { DepotLectureSeances } from "../services/seances.js";

/**
 * L'export de toutes les séries du compte en CSV (D128), derrière une session :
 * l'utilisateur emporte ses données où il veut.
 */
export function routesExport(lecture: DepotLectureSeances, lireSession: LireSession) {
  return new Hono().use(exigerSession(lireSession)).get("/seances.csv", async (c) => {
    const csv = versCsv(await lecture.exporter(c.get("userId")));
    return c.body(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="better-lift.csv"',
    });
  });
}
