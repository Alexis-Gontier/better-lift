import type { SeanceSaisie } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import { SlugInconnu } from "../services/routines.js";
import { type DepotSeances, versEcriture } from "../services/seances.js";
import { routesSeances } from "./seances.js";

const saisie: SeanceSaisie = {
  id: "s-1",
  routineId: null,
  nom: "Push",
  debut: "2026-09-24T18:00:00.000Z",
  fin: "2026-09-24T19:00:00.000Z",
  exercices: [
    {
      slug: "barbell-bench-press",
      reposSec: 120,
      series: [
        { type: "NORMALE", reps: 6, chargeKg: 82.5, faite: true },
        { type: "NORMALE", reps: 6, chargeKg: 82.5, faite: false },
      ],
    },
  ],
};

describe("versEcriture", () => {
  it("déduit les positions et ne retient que les champs connus", () => {
    const avecExtra = {
      ...saisie,
      exercices: [
        { ...saisie.exercices[0], series: [{ ...saisie.exercices[0]?.series[0], rpe: 8 }] },
      ],
    } as SeanceSaisie;
    expect(versEcriture(avecExtra, new Map([["barbell-bench-press", "ex-1"]]))).toEqual([
      {
        position: 0,
        exerciseId: "ex-1",
        reposSec: 120,
        series: [{ position: 0, type: "NORMALE", reps: 6, chargeKg: 82.5, faite: true }],
      },
    ]);
  });

  it("refuse un slug inconnu, en le nommant", () => {
    expect(() => versEcriture(saisie, new Map())).toThrow(SlugInconnu);
  });
});

/** Un dépôt en mémoire qui compte ses écritures : un rejeu ne doit rien réécrire. */
function fauxDepot() {
  const seances = new Map<string, string>();
  let ecritures = 0;
  const depot: DepotSeances = {
    async enregistrer(userId, s) {
      if (s.exercices.some((e) => e.slug === "inconnu")) throw new SlugInconnu("inconnu");
      const deja = seances.get(s.id);
      if (deja) return deja === userId ? "existante" : "conflit";
      seances.set(s.id, userId);
      ecritures++;
      return "creee";
    },
  };
  return { depot, ecritures: () => ecritures };
}

const lireSession: LireSession = async (h) => {
  const u = h.get("x-test-user");
  return u ? { user: { id: u } } : null;
};

function monter() {
  const f = fauxDepot();
  const app = new Hono().route("/seances", routesSeances(f.depot, lireSession));
  const poster = (corps: unknown, user: string | null = "alice") =>
    app.request("/seances", {
      method: "POST",
      headers: { "content-type": "application/json", ...(user ? { "x-test-user": user } : {}) },
      body: JSON.stringify(corps),
    });
  return { poster, ecritures: f.ecritures };
}

describe("POST /seances", () => {
  it("rend 401 sans session", async () => {
    expect((await monter().poster(saisie, null)).status).toBe(401);
  });

  it("crée (201), puis un rejeu rend 200 sans seconde écriture", async () => {
    const { poster, ecritures } = monter();
    expect((await poster(saisie)).status).toBe(201);
    const rejeu = await poster(saisie);
    expect(rejeu.status).toBe(200);
    expect(await rejeu.json()).toEqual({ id: "s-1" });
    expect(ecritures()).toBe(1);
  });

  it("rend 409 si l'identifiant appartient à un autre", async () => {
    const { poster } = monter();
    await poster(saisie, "alice");
    expect((await poster(saisie, "bob")).status).toBe(409);
  });

  it("rend 400 sur un exercice inconnu, en le nommant", async () => {
    const res = await monter().poster({
      ...saisie,
      exercices: [{ ...saisie.exercices[0], slug: "inconnu" }],
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).toContain("inconnu");
  });

  // D57 : un champ en trop ne fait pas perdre une séance.
  it("tolère un champ inconnu", async () => {
    expect((await monter().poster({ ...saisie, appareil: "pixel" })).status).toBe(201);
  });

  it("rend 400 sur une saisie invalide", async () => {
    expect((await monter().poster({ ...saisie, fin: "2026-09-24T17:00:00.000Z" })).status).toBe(
      400,
    );
  });
});
