import { type APIRequestContext, test as base } from "@playwright/test";

/** Le préfixe de tout ce qu'un test crée : on le retrouve et on l'efface (D304). */
export const PREFIXE = "e2e-";

/** Un client d'API sur la session du compte E2E, pour préparer et nettoyer. */
export const test = base.extend<{ api: APIRequestContext }>({
  api: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({
      baseURL: "http://localhost:3001",
      storageState: "e2e/.auth/e2e.json",
      extraHTTPHeaders: { origin: "http://localhost:3000" },
    });
    await use(api);
    await api.dispose();
  },
});

// Faite par défaut ; `faite: false` pose une série sautée.
type Serie = { chargeKg: number | null; reps: number; faite?: boolean };

/**
 * Pose une séance faite par l'API (comme le mobile la poste), son identifiant préfixé : un test
 * qui lit l'historique crée ce qu'il lit. Rend l'identifiant.
 */
export async function creerSeance(
  api: APIRequestContext,
  s: { nom: string; debut: string; exercices: { slug: string; series: Serie[] }[] },
): Promise<string> {
  const id = `${PREFIXE}${crypto.randomUUID()}`;
  const debut = new Date(s.debut);
  const res = await api.post("/seances", {
    data: {
      id,
      routineId: null,
      nom: s.nom,
      debut: debut.toISOString(),
      fin: new Date(debut.getTime() + 60 * 60_000).toISOString(),
      exercices: s.exercices.map((e) => ({
        slug: e.slug,
        reposSec: null,
        note: null,
        supersetGroupe: null,
        series: e.series.map((x) => ({ type: "NORMALE", faite: true, ...x })),
      })),
    },
  });
  if (!res.ok()) throw new Error(`Séance refusée : ${res.status()} ${await res.text()}`);
  return id;
}

/** Pose une routine par l'API, une série de 10 par exercice. Rend son identifiant. */
export async function creerRoutine(
  api: APIRequestContext,
  nom: string,
  slugs: string[],
  dossierId: string | null = null,
): Promise<string> {
  const res = await api.post("/routines", {
    data: {
      nom,
      dossierId,
      exercices: slugs.map((slug) => ({
        slug,
        reposSec: 90,
        series: [{ type: "NORMALE", repsCible: 10, chargeCibleKg: 40 }],
      })),
    },
  });
  if (!res.ok()) throw new Error(`Routine refusée : ${res.status()} ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

/** Supprime les routines et dossiers du compte E2E qui portent le préfixe. */
export async function nettoyerRoutines(api: APIRequestContext) {
  const { routines, dossiers } = (await (await api.get("/routines")).json()) as {
    routines: { id: string; nom: string }[];
    dossiers: { id: string; nom: string }[];
  };
  for (const r of routines) if (r.nom.startsWith(PREFIXE)) await api.delete(`/routines/${r.id}`);
  for (const d of dossiers) if (d.nom.startsWith(PREFIXE)) await api.delete(`/dossiers/${d.id}`);
}

/** Supprime les séances du compte E2E qui portent le préfixe. */
export async function nettoyerSeances(api: APIRequestContext) {
  const { seances } = (await (await api.get("/seances?taille=100")).json()) as {
    seances: { id: string }[];
  };
  for (const s of seances) if (s.id.startsWith(PREFIXE)) await api.delete(`/seances/${s.id}`);
}

export { expect } from "@playwright/test";
