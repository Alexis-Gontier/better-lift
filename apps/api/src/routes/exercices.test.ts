import type { ExerciceDetail, ExerciceResume } from "@better-lift/shared";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { DepotExercices } from "../services/exercices.js";
import { routesExercices } from "./exercices.js";

const resume: ExerciceResume = {
  slug: "barbell-full-squat",
  nom: "Squat complet à la barre",
  groupe: "UPPER_LEGS",
  equipement: "Barre",
  cible: "Quadriceps",
  image: null,
  recherche: "squat complet a la barre barbell full squat",
};

const detail: ExerciceDetail = {
  ...resume,
  nomAnglais: "barbell full squat",
  gif: null,
  secondaires: ["Fessiers"],
  instructions: ["Place la barre sur tes trapèzes."],
};

// Un double, pas une base : la CI n'a pas de PostgreSQL, et ce qu'on vérifie
// ici est le comportement de la ROUTE — validation, codes, forme — pas celui
// de Prisma.
function fauxDepot(): DepotExercices & { derniereRequete?: unknown } {
  const depot = {
    derniereRequete: undefined as unknown,
    async lister(requete: Parameters<DepotExercices["lister"]>[0]) {
      depot.derniereRequete = requete;
      return { exercices: [resume], total: 1 };
    },
    async parSlug(slug: string) {
      return slug === resume.slug ? detail : null;
    },
    async variantes(slug: string) {
      return slug === resume.slug ? [resume] : null;
    },
  };
  return depot;
}

const monter = (depot: DepotExercices) => new Hono().route("/exercices", routesExercices(depot));

describe("GET /exercices", () => {
  it("rend la page et son total", async () => {
    const res = await monter(fauxDepot()).request("/exercices");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ exercices: [resume], total: 1, page: 1, taille: 50 });
  });

  it("transmet la recherche et les filtres au dépôt", async () => {
    const depot = fauxDepot();
    await monter(depot).request("/exercices?q=squat&groupe=UPPER_LEGS&page=2&taille=10");
    expect(depot.derniereRequete).toEqual({
      q: "squat",
      groupe: "UPPER_LEGS",
      page: 2,
      taille: 10,
    });
  });

  it("refuse une requête hors bornes plutôt que de la corriger en silence", async () => {
    const res = await monter(fauxDepot()).request("/exercices?taille=5000");
    expect(res.status).toBe(400);
  });

  it("refuse un groupe inconnu", async () => {
    const res = await monter(fauxDepot()).request("/exercices?groupe=PECTORAUX");
    expect(res.status).toBe(400);
  });
});

describe("GET /exercices/:slug", () => {
  it("rend le détail, instructions comprises", async () => {
    const res = await monter(fauxDepot()).request(`/exercices/${resume.slug}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(detail);
  });

  // Un slug absent doit faire 404, pas 200 avec un corps vide : côté client,
  // c'est la différence entre un état d'erreur et un écran blanc.
  it("rend 404 pour un slug inconnu", async () => {
    const res = await monter(fauxDepot()).request("/exercices/nexiste-pas");
    expect(res.status).toBe(404);
  });
});

describe("GET /exercices (filtres de la grille, D200)", () => {
  it("transmet le muscle ciblé et la liste de slugs", async () => {
    const depot = fauxDepot();
    await monter(depot).request("/exercices?cible=Pectoraux&slugs=bench,squat");
    expect(depot.derniereRequete).toEqual({
      cible: "Pectoraux",
      slugs: ["bench", "squat"],
      page: 1,
      taille: 50,
    });
  });

  it("refuse plus de 200 slugs", async () => {
    const slugs = Array.from({ length: 201 }, (_, i) => `e${i}`).join(",");
    expect((await monter(fauxDepot()).request(`/exercices?slugs=${slugs}`)).status).toBe(400);
  });
});

describe("GET /exercices/:slug/variantes (D204)", () => {
  it("rend les variantes", async () => {
    const res = await monter(fauxDepot()).request(`/exercices/${resume.slug}/variantes`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ variantes: [resume] });
  });

  it("rend 404 pour un slug inconnu", async () => {
    expect((await monter(fauxDepot()).request("/exercices/nexiste-pas/variantes")).status).toBe(
      404,
    );
  });
});
