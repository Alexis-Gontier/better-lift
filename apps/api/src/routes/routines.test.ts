import type { RoutineDetail, RoutineSaisie } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { LireSession } from "../middlewares/session.js";
import type { DepotDossiers } from "../services/dossiers.js";
import { type DepotRoutines, DossierInconnu, SlugInconnu } from "../services/routines.js";
import { routesRoutines } from "./routines.js";

/**
 * Un dépôt en mémoire, qui applique la même règle que le vrai : chaque routine
 * appartient à un utilisateur, et celle d'un autre est introuvable.
 */
function fauxDepot(): DepotRoutines {
  const routines = new Map<string, { userId: string; detail: RoutineDetail }>();
  let suivant = 1;
  const versDetail = (id: string, s: RoutineSaisie): RoutineDetail => {
    if (s.exercices.some((e) => e.slug === "inconnu")) throw new SlugInconnu("inconnu");
    // « inconnu » : un dossier qui n'existe pas, ou pas à lui.
    if (s.dossierId === "inconnu") throw new DossierInconnu();
    return {
      id,
      nom: s.nom,
      note: s.note ?? null,
      dossierId: s.dossierId ?? null,
      exercices: s.exercices.map((e) => ({
        ...e,
        nom: e.slug,
        image: null,
        musclePrincipal: "Pectoraux",
        musclesSecondaires: [],
      })),
    };
  };
  return {
    async lister(userId) {
      return [...routines.values()]
        .filter((r) => r.userId === userId)
        .map(({ detail: d }) => ({
          id: d.id,
          nom: d.nom,
          nbExercices: d.exercices.length,
          nbSeries: 1,
          dossierId: d.dossierId ?? null,
          derniereSeance: null,
        }));
    },
    async lire(userId, id) {
      const r = routines.get(id);
      return r && r.userId === userId ? r.detail : null;
    },
    async creer(userId, saisie) {
      const id = `r${suivant++}`;
      routines.set(id, { userId, detail: versDetail(id, saisie) });
      return id;
    },
    async remplacer(userId, id, saisie) {
      const r = routines.get(id);
      if (!r || r.userId !== userId) return false;
      routines.set(id, { userId, detail: versDetail(id, saisie) });
      return true;
    },
    async supprimer(userId, id) {
      const r = routines.get(id);
      if (!r || r.userId !== userId) return false;
      return routines.delete(id);
    },
    async ordonner(userId, ids) {
      return ids.every((id) => routines.get(id)?.userId === userId);
    },
    async deplacer(userId, id, dossierId) {
      if (dossierId === "inconnu") throw new DossierInconnu();
      const r = routines.get(id);
      if (!r || r.userId !== userId) return false;
      r.detail = { ...r.detail, dossierId };
      return true;
    },
  };
}

/** Pas de dossier : la liste des routines les joint seulement. */
const dossiersVides: DepotDossiers = {
  lister: async () => [],
  creer: async () => "d1",
  renommer: async () => true,
  supprimer: async () => true,
  ordonner: async () => true,
};

/** La session se choisit par un en-tête : « x-test-user: alice ». */
const lireSession: LireSession = async (h) => {
  const u = h.get("x-test-user");
  return u ? { user: { id: u } } : null;
};

const saisie: RoutineSaisie = {
  nom: "Push",
  exercices: [
    {
      slug: "barbell-bench-press",
      reposSec: 120,
      series: [{ type: "NORMALE", repsCible: 8, chargeCibleKg: 80 }],
    },
  ],
};

function client() {
  const app = new Hono().route(
    "/routines",
    routesRoutines(fauxDepot(), dossiersVides, lireSession),
  );
  const envoyer = (methode: string, chemin: string, user: string | null, corps?: unknown) =>
    app.request(chemin, {
      method: methode,
      headers: {
        ...(user ? { "x-test-user": user } : {}),
        ...(corps ? { "content-type": "application/json" } : {}),
      },
      ...(corps ? { body: JSON.stringify(corps) } : {}),
    });
  return envoyer;
}

describe("routes des routines", () => {
  it("rend 401 sans session, sur chaque route", async () => {
    const envoyer = client();
    for (const [m, p] of [
      ["GET", "/routines"],
      ["GET", "/routines/r1"],
      ["POST", "/routines"],
      ["DELETE", "/routines/r1"],
    ] as const) {
      expect((await envoyer(m, p, null, m === "POST" ? saisie : undefined)).status).toBe(401);
    }
  });

  it("crée, relit, remplace puis supprime", async () => {
    const envoyer = client();
    const creation = await envoyer("POST", "/routines", "alice", saisie);
    expect(creation.status).toBe(201);
    const { id } = (await creation.json()) as { id: string };

    expect(
      ((await (await envoyer("GET", `/routines/${id}`, "alice")).json()) as RoutineDetail).nom,
    ).toBe("Push");

    const remplacement = await envoyer("PUT", `/routines/${id}`, "alice", {
      ...saisie,
      nom: "Push lourd",
    });
    expect(remplacement.status).toBe(200);
    expect(
      ((await (await envoyer("GET", `/routines/${id}`, "alice")).json()) as RoutineDetail).nom,
    ).toBe("Push lourd");

    expect((await envoyer("DELETE", `/routines/${id}`, "alice")).status).toBe(204);
    expect((await envoyer("GET", `/routines/${id}`, "alice")).status).toBe(404);
  });

  // D53 : la routine d'autrui est INTROUVABLE, pas interdite — on ne révèle
  // pas qu'elle existe.
  it("rend 404, jamais 403, sur la routine d'un autre", async () => {
    const envoyer = client();
    const { id } = (await (await envoyer("POST", "/routines", "alice", saisie)).json()) as {
      id: string;
    };
    expect((await envoyer("GET", `/routines/${id}`, "bob")).status).toBe(404);
    expect((await envoyer("PUT", `/routines/${id}`, "bob", saisie)).status).toBe(404);
    expect((await envoyer("DELETE", `/routines/${id}`, "bob")).status).toBe(404);
    expect(await (await envoyer("GET", "/routines", "bob")).json()).toEqual({
      routines: [],
      dossiers: [],
    });
  });

  it("rend 400 sur un exercice inconnu du catalogue, en le nommant", async () => {
    const envoyer = client();
    const res = await envoyer("POST", "/routines", "alice", {
      ...saisie,
      exercices: [{ ...saisie.exercices[0], slug: "inconnu" }],
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).toContain("inconnu");
  });

  it("rend 400 sur une saisie invalide", async () => {
    const envoyer = client();
    expect((await envoyer("POST", "/routines", "alice", { ...saisie, nom: "" })).status).toBe(400);
  });

  // « ordre » ne doit pas être pris pour un identifiant de routine.
  it("réordonne la liste, et refuse un identifiant qui n'est pas à soi", async () => {
    const envoyer = client();
    const a = (
      (await (await envoyer("POST", "/routines", "alice", saisie)).json()) as { id: string }
    ).id;
    const b = (
      (await (await envoyer("POST", "/routines", "alice", saisie)).json()) as { id: string }
    ).id;
    expect((await envoyer("PUT", "/routines/ordre", "alice", { ids: [b, a] })).status).toBe(204);
    expect((await envoyer("PUT", "/routines/ordre", "bob", { ids: [b, a] })).status).toBe(404);
    // Un identifiant en double est une saisie fausse, pas une routine introuvable.
    expect((await envoyer("PUT", "/routines/ordre", "alice", { ids: [a, a] })).status).toBe(400);
  });

  it("PATCH /:id range la routine ; 404 sur un dossier ou une routine d'autrui (D297)", async () => {
    const envoyer = client();
    const { id } = (await (await envoyer("POST", "/routines", "alice", saisie)).json()) as {
      id: string;
    };
    expect((await envoyer("PATCH", `/routines/${id}`, "alice", { dossierId: "d1" })).status).toBe(
      200,
    );
    const lue = (await (await envoyer("GET", `/routines/${id}`, "alice")).json()) as RoutineDetail;
    expect(lue.dossierId).toBe("d1");
    expect((await envoyer("PATCH", `/routines/${id}`, "alice", { dossierId: null })).status).toBe(
      200,
    );
    const dossierInconnu = await envoyer("PATCH", `/routines/${id}`, "alice", {
      dossierId: "inconnu",
    });
    expect(dossierInconnu.status).toBe(404);
    expect(await dossierInconnu.json()).toEqual({ erreur: "Dossier introuvable." });
    expect((await envoyer("PATCH", `/routines/${id}`, "bob", { dossierId: null })).status).toBe(
      404,
    );
  });

  it("rend 404 à la création ou au remplacement dans un dossier inconnu", async () => {
    const envoyer = client();
    const dans = { ...saisie, dossierId: "inconnu" };
    expect((await envoyer("POST", "/routines", "alice", dans)).status).toBe(404);
    const { id } = (await (await envoyer("POST", "/routines", "alice", saisie)).json()) as {
      id: string;
    };
    expect((await envoyer("PUT", `/routines/${id}`, "alice", dans)).status).toBe(404);
  });
});
