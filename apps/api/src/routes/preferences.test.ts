import { PREFERENCES_DEFAUT, type Preferences } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import type { DepotPreferences } from "../services/preferences.js";
import { routesPreferences } from "./preferences.js";

const lireSession: LireSession = async (h) => {
  const id = h.get("x-test-user");
  return id ? { user: { id } } : null;
};

/** Un dépôt en mémoire : on vérifie que chacun ne lit et n'écrit que les siennes. */
function monter() {
  const base = new Map<string, Preferences>();
  const depot: DepotPreferences = {
    async lire(userId) {
      return base.get(userId) ?? PREFERENCES_DEFAUT;
    },
    async ecrire(userId, p) {
      base.set(userId, p);
      return p;
    },
  };
  const app = new Hono().route("/preferences", routesPreferences(depot, lireSession));
  const appel = (methode: "GET" | "PUT", user: string | null, corps?: unknown) =>
    app.request("/preferences", {
      method: methode,
      headers: {
        ...(user ? { "x-test-user": user } : {}),
        ...(corps === undefined ? {} : { "content-type": "application/json" }),
      },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
  return { appel };
}

describe("/preferences (D129)", () => {
  it("exige une session", async () => {
    const { appel } = monter();
    expect((await appel("GET", null)).status).toBe(401);
    expect((await appel("PUT", null, PREFERENCES_DEFAUT)).status).toBe(401);
  });

  it("rend les valeurs par défaut à qui n'a rien réglé", async () => {
    const res = await monter().appel("GET", "alice");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PREFERENCES_DEFAUT);
  });

  it("enregistre celles de l'utilisateur de la session, et seulement les siennes", async () => {
    const { appel } = monter();
    const p = { objectifHebdo: 3, reposDefautSec: 120 };
    const ecrit = await appel("PUT", "alice", p);
    expect(ecrit.status).toBe(200);
    expect(await ecrit.json()).toEqual(p);
    expect(await (await appel("GET", "alice")).json()).toEqual(p);
    expect(await (await appel("GET", "bob")).json()).toEqual(PREFERENCES_DEFAUT);
  });

  it("refuse des préférences hors bornes ou incomplètes", async () => {
    const { appel } = monter();
    expect((await appel("PUT", "alice", { objectifHebdo: 9, reposDefautSec: null })).status).toBe(
      400,
    );
    expect((await appel("PUT", "alice", { objectifHebdo: 3 })).status).toBe(400);
  });
});
