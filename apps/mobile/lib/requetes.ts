import type { RoutineSaisie } from "@better-lift/shared";
import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";

/**
 * Les lectures du mobile. Mêmes routes que le web, même client typé : seules
 * l'URL et la façon de joindre la session changent (voir `api.ts`).
 */

export function optionsRoutines() {
  return queryOptions({
    queryKey: ["routines", "liste"],
    queryFn: async () => {
      const res = await api.routines.$get();
      if (!res.ok) throw new Error("Les routines n'ont pas pu être chargées.");
      return (await res.json()).routines;
    },
  });
}

export function optionsRoutine(id: string) {
  return queryOptions({
    queryKey: ["routines", "detail", id],
    queryFn: async () => {
      const res = await api.routines[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Cette routine n'a pas pu être chargée.");
      return res.json();
    },
  });
}

export function optionsCatalogue(q: string) {
  return queryOptions({
    queryKey: ["exercices", "liste", { q }],
    queryFn: async () => {
      const res = await api.exercices.$get({ query: q ? { q, taille: "30" } : { taille: "30" } });
      if (!res.ok) throw new Error("Le catalogue n'a pas pu être chargé.");
      return (await res.json()).exercices;
    },
    // Garde la liste pendant la frappe : sans lui, chaque lettre clignote.
    placeholderData: keepPreviousData,
  });
}

export function optionsExercice(slug: string) {
  return queryOptions({
    queryKey: ["exercices", "detail", slug],
    queryFn: async () => {
      const res = await api.exercices[":slug"].$get({ param: { slug } });
      if (!res.ok) throw new Error("Cet exercice n'a pas pu être chargé.");
      return res.json();
    },
    // Le catalogue ne change qu'au semis : une fiche vue reste bonne.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function optionsRecords(slug: string) {
  return queryOptions({
    queryKey: ["records", slug],
    queryFn: async () => {
      const res = await api.exercices[":slug"].records.$get({ param: { slug } });
      if (!res.ok) throw new Error("Les records n'ont pas pu être chargés.");
      return (await res.json()).records;
    },
  });
}

/** L'historique, antéchronologique, par pages (mêmes clés que le web). */
export function optionsSeances() {
  return infiniteQueryOptions({
    queryKey: ["seances", "liste"],
    queryFn: async ({ pageParam }) => {
      const res = await api.seances.$get({ query: { page: String(pageParam) } });
      if (!res.ok) throw new Error("L'historique n'a pas pu être chargé.");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (d) => (d.page * d.taille < d.total ? d.page + 1 : undefined),
  });
}

export function optionsSeance(id: string) {
  return queryOptions({
    queryKey: ["seances", "detail", id],
    queryFn: async () => {
      const res = await api.seances[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Cette séance n'a pas pu être chargée.");
      return res.json();
    },
  });
}

type Precedents = Record<
  string,
  { reps: number | null; chargeKg: number | null; faite: boolean }[]
>;

/**
 * Ce qui a été fait la dernière fois sur ces exercices (D67).
 *
 * Ne BLOQUE jamais : en salle, sans réseau, on démarre sans indication plutôt
 * que d'attendre. D'où un délai court, et `{}` sur tout échec.
 */
export async function chargerPrecedents(slugs: string[]): Promise<Precedents> {
  if (slugs.length === 0) return {};
  try {
    const res = await api.seances.precedentes.$get(
      { query: { slugs: [...new Set(slugs)].join(",") } },
      { init: { signal: AbortSignal.timeout(3000) } },
    );
    return res.ok ? ((await res.json()) as Precedents) : {};
  } catch {
    return {};
  }
}

// --- Les écritures des routines (D82) -------------------------------------------
// LE PIÈGE DES CLÉS DE CACHE : chaque écriture invalide `["routines"]` EN ENTIER —
// liste et détails —, jamais une clé plus étroite que celle qu'on lit.

/** Le message que l'API a donné, ou un message générique. */
// Un simple « a un `json()` » : le `Response` de React Native n'est pas celui
// que les réponses typées du client RPC déclarent.
async function echec(res: { json(): Promise<unknown> }, parDefaut: string): Promise<never> {
  const corps = (await res.json().catch(() => null)) as { erreur?: string } | null;
  throw new Error(corps?.erreur ?? parDefaut);
}

/** Un appel qui n'atteint pas le serveur : on le dit en français. */
async function joindre<T>(appel: () => Promise<T>): Promise<T> {
  try {
    return await appel();
  } catch {
    throw new Error("Le serveur est injoignable. Vérifie ta connexion, puis réessaie.");
  }
}

function useInvalider() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["routines"] });
}

export function useCreerRoutine() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (r: RoutineSaisie) => {
      const res = await joindre(() => api.routines.$post({ json: r }));
      if (!res.ok) return echec(res, "La routine n'a pas pu être créée.");
      return (await res.json()).id;
    },
    onSuccess: invalider,
  });
}

export function useRemplacerRoutine(id: string) {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: async (r: RoutineSaisie) => {
      const res = await joindre(() => api.routines[":id"].$put({ param: { id }, json: r }));
      if (!res.ok) return echec(res, "La routine n'a pas pu être enregistrée.");
    },
    onSuccess: invalider,
  });
}

export function useSupprimerRoutine() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await joindre(() => api.routines[":id"].$delete({ param: { id } }));
      if (!res.ok) return echec(res, "La routine n'a pas pu être supprimée.");
    },
    // Le détail d'une routine supprimée se RETIRE du cache : l'invalider le
    // referait, la page encore montée dessous recevrait un 404, et les
    // tentatives de TanStack Query tiendraient la suppression en attente.
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: ["routines", "detail", id] });
      return client.invalidateQueries({ queryKey: ["routines", "liste"] });
    },
  });
}
