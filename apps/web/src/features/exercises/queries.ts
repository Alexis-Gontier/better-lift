import type { Groupe } from "@better-lift/shared";
import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Filters = { q?: string; groupe?: Groupe };

/**
 * La liste du catalogue.
 *
 * LE PIÈGE DES CLÉS DE CACHE : toute donnée qui entre dans la requête DOIT
 * entrer dans la clé. Une recherche ou un filtre absent de la clé ferait
 * réafficher les résultats précédents après un changement de critère — un défaut
 * qui ressemble à de la lenteur et qu'on ne soupçonne pas.
 *
 * `keepPreviousData` garde la liste affichée pendant la frappe : sans lui, chaque
 * lettre tapée renvoie l'écran à son état de chargement, ce qui clignote.
 *
 * PAGINÉE : l'API plafonne une page à 100 exercices, et le catalogue en compte
 * 1 316. Sans pages suivantes, la liste s'arrêtait aux 50 premiers sans moyen
 * de voir le reste. `page` n'entre pas dans la clé : c'est le `pageParam` d'une
 * même requête infinie, pas un critère.
 */
export function catalogOptions({ q, groupe: group }: Filters) {
  return infiniteQueryOptions({
    queryKey: ["exercises", "list", { q: q ?? null, groupe: group ?? null }],
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) => {
      // Les clés absentes sont omises plutôt que posées à `undefined` : le client
      // RPC sérialise ce qu'on lui donne, et `?q=undefined` serait une recherche.
      const res = await api.exercices.$get({
        query: {
          ...(q ? { q } : {}),
          ...(group ? { groupe: group } : {}),
          page: String(pageParam),
        },
      });
      if (!res.ok) throw new Error("Le catalogue n'a pas pu être chargé.");
      return res.json();
    },
    // Après `queryFn` : TypeScript tire le type d'une page de son retour.
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.taille < last.total ? last.page + 1 : undefined),
  });
}

export function exerciseOptions(slug: string) {
  return queryOptions({
    queryKey: ["exercises", "detail", slug],
    queryFn: async () => {
      const res = await api.exercices[":slug"].$get({ param: { slug } });
      if (!res.ok) throw new Error("Cet exercice n'a pas pu être chargé.");
      return res.json();
    },
  });
}

/**
 * Les séances où figure l'exercice (D141), de la plus récente à la plus ancienne.
 * Sous `["sessions"]` : supprimer une séance l'invalide (D140).
 */
export function historyOptions(slug: string) {
  return queryOptions({
    queryKey: ["sessions", "history", slug],
    queryFn: async () => {
      const res = await api.exercices[":slug"].historique.$get({ param: { slug } });
      if (!res.ok) throw new Error("L'historique de l'exercice n'a pas pu être chargé.");
      return (await res.json()).seances;
    },
  });
}
