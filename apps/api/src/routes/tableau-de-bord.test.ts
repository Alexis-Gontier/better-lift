import type { TableauDeBord } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import type { DepotTableauDeBord } from "../services/tableau-de-bord.js";
import { routesTableauDeBord } from "./tableau-de-bord.js";

const lireSession: LireSession = async (h) => {
  const id = h.get("x-test-user");
  return id ? { user: { id } } : null;
};

const VIDE: TableauDeBord = { seances: [], total: 0, objectifHebdo: null };

function monter() {
  const appels: { userId: string; depuis: string }[] = [];
  const depot: DepotTableauDeBord = {
    async lire(userId, depuis) {
      appels.push({ userId, depuis: depuis.toISOString() });
      return VIDE;
    },
  };
  const app = new Hono().route("/tableau-de-bord", routesTableauDeBord(depot, lireSession));
  const lire = (q: string, user: string | null = "alice") =>
    app.request(`/tableau-de-bord${q}`, { headers: user ? { "x-test-user": user } : {} });
  return { lire, appels };
}

describe("GET /tableau-de-bord (D330)", () => {
  it("exige une session", async () => {
    const { lire } = monter();
    expect((await lire("?depuis=2026-08-23T00:00:00.000Z", null)).status).toBe(401);
  });

  it("refuse un `depuis` absent ou invalide", async () => {
    const { lire } = monter();
    expect((await lire("")).status).toBe(400);
    expect((await lire("?depuis=hier")).status).toBe(400);
  });

  it("passe l'utilisateur de la session et la date, et rend le tableau", async () => {
    const { lire, appels } = monter();
    const res = await lire("?depuis=2026-08-23T00:00:00.000Z");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(VIDE);
    expect(appels).toEqual([{ userId: "alice", depuis: "2026-08-23T00:00:00.000Z" }]);
  });
});
