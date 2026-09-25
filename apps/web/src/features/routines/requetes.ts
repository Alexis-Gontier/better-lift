import type { RoutineSaisie } from "@better-lift/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * LE PIÈGE DES CLÉS DE CACHE : lectures et écritures partagent le préfixe
 * `["routines"]`, et chaque écriture l'invalide EN ENTIER — liste et détails.
 * Invalider une clé plus étroite que celle qu'on lit laisserait l'écran sur
 * l'ancienne version après un enregistrement pourtant réussi.
 */
const RACINE = ["routines"] as const;

export function optionsRoutines() {
  return queryOptions({
    queryKey: [...RACINE, "liste"],
    queryFn: async () => {
      const res = await api.routines.$get();
      if (!res.ok) throw new Error("Les routines n'ont pas pu être chargées.");
      return (await res.json()).routines;
    },
  });
}

export function optionsRoutine(id: string) {
  return queryOptions({
    queryKey: [...RACINE, "detail", id],
    queryFn: async () => {
      const res = await api.routines[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Cette routine n'a pas pu être chargée.");
      return res.json();
    },
  });
}

/** Le message que l'API a donné, ou un message générique. */
async function echec(res: Response, parDefaut: string): Promise<never> {
  const corps = (await res.json().catch(() => null)) as { erreur?: string } | null;
  throw new Error(corps?.erreur ?? parDefaut);
}

/**
 * Un appel qui n'atteint pas le serveur rejette avec le message du navigateur —
 * « Failed to fetch », en anglais. L'application est en français : on le traduit.
 */
// Générique, pour ne pas perdre le typage RPC : un `Response` nu ferait de
// `res.json()` un `any`, sans la moindre erreur pour le signaler.
async function joindre<T>(appel: () => Promise<T>): Promise<T> {
  try {
    return await appel();
  } catch {
    throw new Error("Le serveur est injoignable. Vérifie ta connexion, puis réessaie.");
  }
}

function useInvalider() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: RACINE });
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
    // Pas d'invalidation de toute la racine ici : elle referait la requête du
    // détail de la routine qu'on vient de supprimer — encore affichée à cet
    // instant —, soit un 404 puis ses tentatives. On RETIRE ce détail, et on ne
    // rafraîchit que la liste.
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: [...RACINE, "detail", id] });
      return client.invalidateQueries({ queryKey: [...RACINE, "liste"] });
    },
  });
}

/**
 * Ce qui a été fait la dernière fois sur ces exercices, série par série (D67).
 * La clé porte les slugs triés : deux routines aux mêmes exercices partagent la
 * lecture, et l'ordre des cartes ne la refait pas.
 */
export function optionsPrecedentes(slugs: string[]) {
  const tries = [...new Set(slugs)].sort();
  return queryOptions({
    queryKey: ["seances", "precedentes", tries],
    queryFn: async () => {
      const res = await api.seances.precedentes.$get({ query: { slugs: tries.join(",") } });
      if (!res.ok) throw new Error("La dernière fois n'a pas pu être chargée.");
      return (await res.json()) as Record<
        string,
        { reps: number | null; chargeKg: number | null; faite: boolean }[]
      >;
    },
    enabled: tries.length > 0,
  });
}
