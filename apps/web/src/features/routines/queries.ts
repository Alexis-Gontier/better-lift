import type { RoutineResume, RoutineSaisie } from "@better-lift/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * LE PIÈGE DES CLÉS DE CACHE : lectures et écritures partagent le préfixe
 * `["routines"]`, et chaque écriture l'invalide EN ENTIER — liste et détails.
 * Invalider une clé plus étroite que celle qu'on lit laisserait l'écran sur
 * l'ancienne version après un enregistrement pourtant réussi.
 */
const ROOT = ["routines"] as const;

export function routinesOptions() {
  return queryOptions({
    queryKey: [...ROOT, "list"],
    queryFn: async () => {
      const res = await api.routines.$get();
      if (!res.ok) throw new Error("Les routines n'ont pas pu être chargées.");
      return (await res.json()).routines;
    },
  });
}

export function routineOptions(id: string) {
  return queryOptions({
    queryKey: [...ROOT, "detail", id],
    queryFn: async () => {
      const res = await api.routines[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Cette routine n'a pas pu être chargée.");
      return res.json();
    },
  });
}

/** Le message que l'API a donné, ou un message générique. */
async function failure(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as { erreur?: string } | null;
  throw new Error(body?.erreur ?? fallback);
}

/**
 * Un appel qui n'atteint pas le serveur rejette avec le message du navigateur —
 * « Failed to fetch », en anglais. L'application est en français : on le traduit.
 */
// Générique, pour ne pas perdre le typage RPC : un `Response` nu ferait de
// `res.json()` un `any`, sans la moindre erreur pour le signaler.
async function join<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch {
    throw new Error("Le serveur est injoignable. Vérifie ta connexion, puis réessaie.");
  }
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ROOT });
}

export function useCreateRoutine() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (r: RoutineSaisie) => {
      const res = await join(() => api.routines.$post({ json: r }));
      if (!res.ok) return failure(res, "La routine n'a pas pu être créée.");
      return (await res.json()).id;
    },
    onSuccess: invalidate,
  });
}

export function useReplaceRoutine(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (r: RoutineSaisie) => {
      const res = await join(() => api.routines[":id"].$put({ param: { id }, json: r }));
      if (!res.ok) return failure(res, "La routine n'a pas pu être enregistrée.");
    },
    onSuccess: invalidate,
  });
}

export function useDeleteRoutine() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await join(() => api.routines[":id"].$delete({ param: { id } }));
      if (!res.ok) return failure(res, "La routine n'a pas pu être supprimée.");
    },
    // Pas d'invalidation de toute la racine ici : elle referait la requête du
    // détail de la routine qu'on vient de supprimer — encore affichée à cet
    // instant —, soit un 404 puis ses tentatives. On RETIRE ce détail, et on ne
    // rafraîchit que la liste.
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: [...ROOT, "detail", id] });
      return client.invalidateQueries({ queryKey: [...ROOT, "list"] });
    },
  });
}

/**
 * L'ordre des routines (D142), celui que suit « À suivre » sur le mobile. La liste
 * se réordonne AVANT la réponse : au glisser, attendre le serveur ferait sauter la
 * carte à sa place d'avant. En échec, on revient à l'ordre d'avant.
 */
export function useReorderRoutines() {
  const client = useQueryClient();
  const key = [...ROOT, "list"];
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await join(() => api.routines.ordre.$put({ json: { ids } }));
      if (!res.ok) return failure(res, "L'ordre des routines n'a pas pu être enregistré.");
    },
    onMutate: async (ids) => {
      await client.cancelQueries({ queryKey: key });
      const before = client.getQueryData<RoutineResume[]>(key);
      if (before) {
        const byId = new Map(before.map((r) => [r.id, r]));
        client.setQueryData(
          key,
          ids.flatMap((id) => byId.get(id) ?? []),
        );
      }
      return { avant: before };
    },
    onError: (_e, _ids, context) => {
      if (context?.avant) client.setQueryData(key, context.avant);
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  });
}

/**
 * Ce qui a été fait la dernière fois sur ces exercices, série par série (D67).
 * La clé porte les slugs triés : deux routines aux mêmes exercices partagent la
 * lecture, et l'ordre des cartes ne la refait pas.
 */
export function previousOptions(slugs: string[]) {
  const sorted = [...new Set(slugs)].sort();
  return queryOptions({
    queryKey: ["sessions", "previous", sorted],
    queryFn: async () => {
      const res = await api.seances.precedentes.$get({ query: { slugs: sorted.join(",") } });
      if (!res.ok) throw new Error("La dernière fois n'a pas pu être chargée.");
      return (await res.json()) as Record<
        string,
        { reps: number | null; chargeKg: number | null; faite: boolean }[]
      >;
    },
    enabled: sorted.length > 0,
  });
}
