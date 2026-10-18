import type { HistoriqueExercice } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import type { DepotLectureSeances } from "../services/seances.js";
import { routesRecords } from "./records.js";

const lireSession: LireSession = async (h) => {
  const id = h.get("x-test-user");
  return id ? { user: { id } } : null;
};

const historique: HistoriqueExercice = [
  {
    id: "s-1",
    nom: "Push A",
    debut: "2026-10-03T17:00:00.000Z",
    series: [{ type: "NORMALE", reps: 5, chargeKg: 85, faite: true }],
  },
];

const fait = { slug: "bench", derniereFois: "2026-10-03T17:00:00.000Z", meilleur1Rm: 99.2 };

/** Seule alice a un historique, et seul « bench » existe. */
const lecture = {
  async historiqueExercice(userId: string, slug: string) {
    if (slug !== "bench") return null;
    return userId === "alice" ? historique : [];
  },
  async exercicesFaits(userId: string) {
    return userId === "alice" ? [fait] : [];
  },
} as unknown as DepotLectureSeances;

const app = new Hono().route("/exercices", routesRecords(lecture, lireSession));
const lire = (chemin: string, user: string | null = "alice") =>
  app.request(chemin, { headers: user ? { "x-test-user": user } : {} });

describe("GET /exercices/faits (D312)", () => {
  it("exige une session, puis rend les exercices de l'utilisateur, et seulement les siens", async () => {
    expect((await lire("/exercices/faits", null)).status).toBe(401);
    const res = await lire("/exercices/faits");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ exercices: [fait] });
    expect(await (await lire("/exercices/faits", "bob")).json()).toEqual({ exercices: [] });
  });
});

describe("GET /exercices/:slug/historique (D124)", () => {
  it("exige une session", async () => {
    expect((await lire("/exercices/bench/historique", null)).status).toBe(401);
  });

  it("rend les séances de l'utilisateur de la session, et seulement les siennes", async () => {
    const res = await lire("/exercices/bench/historique");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ seances: historique });
    expect(await (await lire("/exercices/bench/historique", "bob")).json()).toEqual({
      seances: [],
    });
  });

  it("rend 404 pour un exercice inconnu", async () => {
    expect((await lire("/exercices/inconnu/historique")).status).toBe(404);
  });
});
