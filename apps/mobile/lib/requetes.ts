import type { ExerciceResume, Preferences, RoutineSaisie, SeanceFil } from "@better-lift/shared";
import {
  type InfiniteData,
  infiniteQueryOptions,
  onlineManager,
  type QueryClient,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import { avantDelai, UNE_SEMAINE } from "./hors-ligne";

/**
 * Les lectures du mobile. Mêmes routes que le web, même client typé : seules
 * l'URL et la façon de joindre la session changent (voir `api.ts`).
 */

/** Les routines et leurs dossiers (D297, D320). */
export function optionsRoutines() {
  return queryOptions({
    queryKey: ["routines", "liste"],
    queryFn: async () => {
      const res = await api.routines.$get();
      if (!res.ok) throw new Error("Les routines n'ont pas pu être chargées.");
      return res.json();
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

/**
 * Le catalogue ENTIER, pour le filtrer sur le téléphone, hors ligne compris
 * (D97). Pages de 100 : l'API plafonne la taille, et c'est voulu. ~1 300
 * exercices, ~400 Ko, une fois par semaine au plus.
 */
export function optionsCatalogueComplet() {
  return queryOptions({
    queryKey: ["exercices", "complet"],
    queryFn: async () => {
      const tous: ExerciceResume[] = [];
      for (let page = 1; ; page++) {
        const res = await api.exercices.$get({ query: { page: String(page), taille: "100" } });
        if (!res.ok) throw new Error("Le catalogue n'a pas pu être chargé.");
        const d = await res.json();
        tous.push(...d.exercices);
        if (d.exercices.length === 0 || tous.length >= d.total) return tous;
      }
    },
    // Le catalogue ne change qu'au semis.
    staleTime: UNE_SEMAINE,
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

/**
 * Une séance passée (D345), en lecture. `null` : elle n'existe pas, ou plus — la donnée
 * d'autrui répond 404 aussi (D53). Pas gardée hors ligne, comme la liste.
 */
export function optionsSeance(id: string) {
  return queryOptions({
    queryKey: ["seances", "detail", id],
    queryFn: async () => {
      const res = await api.seances[":id"].$get({ param: { id } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("La séance n'a pas pu être chargée.");
      return res.json();
    },
  });
}

type PageSeances = { seances: SeanceFil[]; total: number; page: number; taille: number };

/**
 * Supprimer une séance (D345). Elle sort aussitôt des pages chargées ; son détail est retiré
 * du cache, pas invalidé (il referait un GET, soit un 404). Les précédents et les routines
 * (« Il y a 3 j ») dérivent des séances : ils se relisent.
 */
export function useSupprimerSeance() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await joindre(() => api.seances[":id"].$delete({ param: { id } }));
      if (!res.ok && res.status !== 404) return echec(res, "La séance n'a pas pu être supprimée.");
    },
    onSuccess: (_, id) => {
      client.setQueryData<InfiniteData<PageSeances>>(optionsSeances().queryKey, (d) =>
        d
          ? {
              ...d,
              pages: d.pages.map((p) => ({
                ...p,
                seances: p.seances.filter((s) => s.id !== id),
                total: p.seances.some((s) => s.id === id) ? p.total - 1 : p.total,
              })),
            }
          : d,
      );
      client.removeQueries({ queryKey: ["seances", "detail", id] });
      void client.invalidateQueries({ queryKey: ["seances", "precedents"] });
      void client.invalidateQueries({ queryKey: ["routines"] });
    },
  });
}

type Precedents = Record<
  string,
  { reps: number | null; chargeKg: number | null; faite: boolean }[]
>;

/**
 * Ce qui a été fait la dernière fois sur ces exercices (D67). Rangé sous
 * `["seances", …]` : l'envoi d'une séance invalide `["seances"]`, donc aussi
 * ceci. La clé trie les slugs : le même ensemble donne la même entrée.
 */
function optionsPrecedents(slugs: string[]) {
  const cle = [...new Set(slugs)].sort().join(",");
  return queryOptions({
    queryKey: ["seances", "precedents", cle],
    queryFn: async (): Promise<Precedents> => {
      const res = await api.seances.precedentes.$get({ query: { slugs: cle } });
      if (!res.ok) throw new Error("La dernière fois n'a pas pu être chargée.");
      return (await res.json()) as Precedents;
    },
  });
}

// Réseau d'abord, sans tentative ni pause hors ligne : la décision de se
// rabattre sur le cache est prise ici, pas par TanStack Query (D98).
const SANS_ATTENTE = { retry: false, networkMode: "always", staleTime: 0 } as const;

/**
 * Le réseau sous délai, sinon le cache. Hors ligne déclaré, on ne tente même
 * pas : sur Android en mode avion, une requête attend son délai entier avant
 * d'échouer, et l'appui sur Démarrer en paierait chaque seconde.
 */
async function reseauSinonCache<T>(
  client: QueryClient,
  options: { queryKey: readonly unknown[] },
  lire: () => Promise<T>,
  ms: number,
): Promise<T | undefined> {
  if (onlineManager.isOnline()) {
    try {
      return await avantDelai(lire(), ms);
    } catch {
      // Le repli ci-dessous.
    }
  }
  return client.getQueryData<T>(options.queryKey);
}

/**
 * Ne BLOQUE jamais : réseau sous 3 s, sinon la dernière réponse en cache,
 * sinon rien. En salle, on démarre sans indication plutôt que d'attendre.
 */
export async function chargerPrecedents(client: QueryClient, slugs: string[]): Promise<Precedents> {
  if (slugs.length === 0) return {};
  const options = optionsPrecedents(slugs);
  const lus = await reseauSinonCache(
    client,
    options,
    () => client.fetchQuery({ ...options, ...SANS_ATTENTE }),
    3000,
  );
  return lus ?? {};
}

/**
 * Le détail d'une routine pour la démarrer : réseau sous 4 s, sinon le cache
 * (D98). Sans l'un ni l'autre, l'erreur remonte : l'appelant le dit.
 */
export async function chargerRoutine(client: QueryClient, id: string) {
  const options = optionsRoutine(id);
  const lue = await reseauSinonCache(
    client,
    options,
    () => client.fetchQuery({ ...options, ...SANS_ATTENTE }),
    4000,
  );
  if (!lue) throw new Error("Routine indisponible hors ligne.");
  return lue;
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

/**
 * La routine reprend la séance du jour (D347), depuis la fin. Invalide `["routines"]`
 * en entier : la liste (nombre de séries, durée) comme le détail.
 */
export function useMettreAJourRoutine() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, saisie }: { id: string; saisie: RoutineSaisie }) => {
      const res = await joindre(() => api.routines[":id"].$put({ param: { id }, json: saisie }));
      if (!res.ok) return echec(res, "La routine n'a pas pu être mise à jour.");
    },
    onSettled: () => client.invalidateQueries({ queryKey: ["routines"] }),
  });
}

/** Les préférences du compte (D129), gardées hors ligne : la séance lit le repos par défaut. */
export function optionsPreferences() {
  return queryOptions({
    queryKey: ["preferences"],
    queryFn: async () => {
      const res = await api.preferences.$get();
      if (!res.ok) throw new Error("Les préférences n'ont pas pu être chargées.");
      return res.json();
    },
  });
}

export function useEcrirePreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (p: Preferences) => {
      const res = await joindre(() => api.preferences.$put({ json: p }));
      if (!res.ok) return echec(res, "Les préférences n'ont pas pu être enregistrées.");
      return res.json();
    },
    // Affichées tout de suite : un réglage qui attend le réseau paraît ignoré.
    onMutate: (p) => client.setQueryData(optionsPreferences().queryKey, p),
    onSettled: () => client.invalidateQueries({ queryKey: ["preferences"] }),
  });
}
