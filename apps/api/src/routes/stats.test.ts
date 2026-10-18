import type { StatsPeriode } from "@better-lift/shared";
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
  const appels: { userId: string; fuseau: string; periode?: string }[] = [];
  const depot: DepotStats = {
    async bilan(userId) {
      appels.push({ userId, fuseau: "" });
      return { nbSeances: 12, volumeKg: 34_500, depuis: "2026-03-02T17:00:00.000Z" };
    },
    async lirePeriode(userId, _maintenant, fuseau, periode) {
      appels.push({ userId, fuseau, periode });
      const totaux = { seances: 0, series: 0, dureeMin: 0, volumeKg: 0 };
      return {
        periode,
        nbSemaines: 4,
        premierLundi: "2026-09-07",
        totaux,
        precedents: totaux,
        jours: [],
        volumes: [],
        zones: [],
        muscles: [],
        records: [],
        nbSeances: 3,
      } satisfies StatsPeriode;
    },
  };
  const app = new Hono().route("/stats", routesStats(depot, lireSession));
  const lire = (chemin: string, user: string | null = "alice") =>
    app.request(chemin, { headers: user ? { "x-test-user": user } : {} });
  return { lire, appels };
}

describe("GET /stats/periode (D125)", () => {
  it("exige une session", async () => {
    expect((await monter().lire("/stats/periode?periode=mois", null)).status).toBe(401);
  });

  it("calcule la période demandée, dans le fuseau, pour l'utilisateur de la session", async () => {
    const { lire, appels } = monter();
    const res = await lire("/stats/periode?periode=trimestre&fuseau=America/Montreal");
    expect(res.status).toBe(200);
    expect(((await res.json()) as StatsPeriode).periode).toBe("trimestre");
    expect(appels).toEqual([{ userId: "alice", fuseau: "America/Montreal", periode: "trimestre" }]);
  });

  it("prend Paris sans fuseau, et refuse un fuseau inconnu", async () => {
    const { lire, appels } = monter();
    expect((await lire("/stats/periode?periode=mois")).status).toBe(200);
    expect(appels[0]?.fuseau).toBe("Europe/Paris");
    expect((await lire("/stats/periode?periode=mois&fuseau=Mars/Olympus")).status).toBe(400);
  });

  it("refuse une période inconnue ou absente", async () => {
    const { lire } = monter();
    expect((await lire("/stats/periode?periode=siecle")).status).toBe(400);
    expect((await lire("/stats/periode")).status).toBe(400);
  });
});

describe("GET /stats/bilan (D128)", () => {
  it("exige une session, puis rend le bilan de l'utilisateur de la session", async () => {
    const { lire, appels } = monter();
    expect((await lire("/stats/bilan", null)).status).toBe(401);
    const res = await lire("/stats/bilan");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      nbSeances: 12,
      volumeKg: 34_500,
      depuis: "2026-03-02T17:00:00.000Z",
    });
    expect(appels[0]?.userId).toBe("alice");
  });
});

describe("routes retirées (D295)", () => {
  it("ne sert plus GET /stats ni GET /stats/exercices", async () => {
    const { lire } = monter();
    expect((await lire("/stats")).status).toBe(404);
    expect((await lire("/stats/exercices?periode=mois")).status).toBe(404);
  });
});
