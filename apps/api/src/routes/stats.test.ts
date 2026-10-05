import type { Stats } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import type { DepotStats } from "../services/stats.js";
import { routesStats } from "./stats.js";

const lireSession: LireSession = async (h) => {
  const id = h.get("x-test-user");
  return id ? { user: { id } } : null;
};

/** Un dépôt qui rend ce qu'on lui a demandé : on vérifie ce que la route lui passe. */
function monter() {
  const appels: { userId: string; fuseau: string }[] = [];
  const depot: DepotStats = {
    async lire(userId, _maintenant, fuseau) {
      appels.push({ userId, fuseau });
      return { nbSeances: 3, semaines: [], recordsRecents: [], muscles: [] } satisfies Stats;
    },
  };
  const app = new Hono().route("/stats", routesStats(depot, lireSession));
  const lire = (chemin: string, user: string | null = "alice") =>
    app.request(chemin, { headers: user ? { "x-test-user": user } : {} });
  return { lire, appels };
}

describe("GET /stats (D112)", () => {
  it("exige une session", async () => {
    expect((await monter().lire("/stats", null)).status).toBe(401);
  });

  it("calcule pour l'utilisateur de la session, dans le fuseau demandé", async () => {
    const { lire, appels } = monter();
    const res = await lire("/stats?fuseau=America/Montreal");
    expect(res.status).toBe(200);
    expect(((await res.json()) as Stats).nbSeances).toBe(3);
    expect(appels).toEqual([{ userId: "alice", fuseau: "America/Montreal" }]);
  });

  it("prend Paris sans fuseau, et refuse un fuseau inconnu", async () => {
    const { lire, appels } = monter();
    expect((await lire("/stats")).status).toBe(200);
    expect(appels[0]?.fuseau).toBe("Europe/Paris");
    expect((await lire("/stats?fuseau=Mars/Olympus")).status).toBe(400);
  });
});
