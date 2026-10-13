import type { ExerciceProgres, Stats, StatsPeriode } from "@better-lift/shared";
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
  const appels: { userId: string; fuseau: string; periode?: string; decalage?: number }[] = [];
  const depot: DepotStats = {
    async lire(userId, _maintenant, fuseau) {
      appels.push({ userId, fuseau });
      return { nbSeances: 3, semaines: [], recordsRecents: [], muscles: [] } satisfies Stats;
    },
    async bilan(userId) {
      appels.push({ userId, fuseau: "" });
      return { nbSeances: 12, volumeKg: 34_500, depuis: "2026-03-02T17:00:00.000Z" };
    },
    async lirePeriode(userId, _maintenant, fuseau, periode, decalage) {
      appels.push({ userId, fuseau, periode, decalage });
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
    async lireExercices(userId, _maintenant, fuseau, periode) {
      appels.push({ userId, fuseau, periode });
      return [
        {
          slug: "dc",
          nom: "Développé couché",
          image: null,
          derniereFois: "2026-10-01T17:00:00.000Z",
          unRm: 120,
          unRmDebut: 116,
        },
      ] satisfies ExerciceProgres[];
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

describe("GET /stats/periode (D125)", () => {
  it("exige une session", async () => {
    expect((await monter().lire("/stats/periode?periode=mois", null)).status).toBe(401);
  });

  it("calcule la période demandée, dans le fuseau, pour l'utilisateur de la session", async () => {
    const { lire, appels } = monter();
    const res = await lire("/stats/periode?periode=trimestre&fuseau=America/Montreal");
    expect(res.status).toBe(200);
    expect(((await res.json()) as StatsPeriode).periode).toBe("trimestre");
    expect(appels).toEqual([
      { userId: "alice", fuseau: "America/Montreal", periode: "trimestre", decalage: 0 },
    ]);
  });

  it("recule de `decalage` périodes, et refuse un décalage négatif (D190)", async () => {
    const { lire, appels } = monter();
    expect((await lire("/stats/periode?periode=semaine&decalage=2")).status).toBe(200);
    expect(appels[0]?.decalage).toBe(2);
    expect((await lire("/stats/periode?periode=semaine&decalage=-1")).status).toBe(400);
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

describe("GET /stats/exercices (D173)", () => {
  it("exige une session", async () => {
    expect((await monter().lire("/stats/exercices?periode=mois", null)).status).toBe(401);
  });

  it("lit les exercices de la période, dans le fuseau, pour l'utilisateur de la session", async () => {
    const { lire, appels } = monter();
    const res = await lire("/stats/exercices?periode=annee&fuseau=America/Montreal");
    expect(res.status).toBe(200);
    expect(((await res.json()) as ExerciceProgres[])[0]?.slug).toBe("dc");
    expect(appels).toEqual([{ userId: "alice", fuseau: "America/Montreal", periode: "annee" }]);
  });

  it("refuse une période inconnue", async () => {
    expect((await monter().lire("/stats/exercices?periode=siecle")).status).toBe(400);
  });
});
