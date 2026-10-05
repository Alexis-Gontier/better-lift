import type { LigneExport } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import type { DepotLectureSeances } from "../services/seances.js";
import { routesExport } from "./export.js";

const lireSession: LireSession = async (h) => {
  const id = h.get("x-test-user");
  return id ? { user: { id } } : null;
};

const ligne: LigneExport = {
  date: "2026-10-03T17:00:00.000Z",
  seance: "Push A",
  exercice: "Dips",
  serie: 1,
  type: "NORMALE",
  chargeKg: null,
  reps: 12,
  faite: true,
};

/** Seule alice a des séries : on vérifie que l'export lit celles de la session. */
const lecture = {
  async exporter(userId: string) {
    return userId === "alice" ? [ligne] : [];
  },
} as unknown as DepotLectureSeances;

const app = new Hono().route("/export", routesExport(lecture, lireSession));
const lire = (user: string | null) =>
  app.request("/export/seances.csv", { headers: user ? { "x-test-user": user } : {} });

describe("GET /export/seances.csv (D128)", () => {
  it("exige une session", async () => {
    expect((await lire(null)).status).toBe(401);
  });

  it("rend les séries de l'utilisateur de la session en CSV, en pièce jointe", async () => {
    const res = await lire("alice");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("better-lift.csv");
    const csv = await res.text();
    expect(csv.split("\r\n")[1]).toBe("2026-10-03T17:00:00.000Z,Push A,Dips,1,NORMALE,,12,true");
    expect((await (await lire("bob")).text()).split("\r\n").filter(Boolean)).toHaveLength(1);
  });
});
