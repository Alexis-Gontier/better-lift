import type { Groupe } from "@better-lift/shared";
import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Les filtres de la grille (D200), tels qu'ils partent à l'API. */
export type CatalogFilters = {
  q?: string;
  /** Le groupe : le filtre du sélecteur d'exercices des routines. */
  group?: Groupe;
  target?: string;
  equipment?: string;
  slugs?: string[];
  /** L'ordre de l'API (D210) : par nom (défaut) ou par pertinence. */
  order?: "name" | "relevance";
};

/**
 * La liste du catalogue.
 *
 * LE PIÈGE DES CLÉS DE CACHE : toute donnée qui entre dans la requête DOIT
 * entrer dans la clé. Une recherche ou un filtre absent de la clé ferait
 * réafficher les résultats précédents après un changement de critère — un défaut
 * qui ressemble à de la lenteur et qu'on ne soupçonne pas.
 *
 * `keepPreviousData` garde la grille affichée pendant la frappe : sans lui, chaque
 * lettre tapée renvoie l'écran à son état de chargement, ce qui clignote.
 *
 * PAGINÉE : l'API plafonne une page à 100 exercices, et le catalogue en compte
 * 1 316. `page` n'entre pas dans la clé : c'est le `pageParam` d'une même requête
 * infinie, pas un critère.
 */
export function catalogOptions({ q, group, target, equipment, slugs, order }: CatalogFilters) {
  return infiniteQueryOptions({
    queryKey: [
      "exercises",
      "list",
      {
        q: q ?? null,
        group: group ?? null,
        target: target ?? null,
        equipment: equipment ?? null,
        slugs: slugs ?? null,
        order: order ?? "name",
      },
    ],
    placeholderData: keepPreviousData,
    queryFn: async ({ pageParam }) => {
      // Les clés absentes sont omises plutôt que posées à `undefined` : le client
      // RPC sérialise ce qu'on lui donne, et `?q=undefined` serait une recherche.
      const res = await api.exercices.$get({
        query: {
          ...(q ? { q } : {}),
          ...(group ? { groupe: group } : {}),
          ...(target ? { cible: target } : {}),
          ...(equipment ? { equipement: equipment } : {}),
          ...(slugs ? { slugs: slugs.join(",") } : {}),
          ...(order === "relevance" ? { ordre: "pertinence" as const } : {}),
          page: String(pageParam),
          taille: "60",
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

/**
 * « Mes exercices » (D205) : par exercice pratiqué, le nombre de séances et la dernière.
 * Sous `["sessions"]` : enregistrer ou supprimer une séance l'invalide.
 */
export function practicedOptions() {
  return queryOptions({
    queryKey: ["sessions", "practiced"],
    queryFn: async () => {
      const res = await api.exercices.pratiques.$get();
      if (!res.ok) throw new Error("Tes exercices n'ont pas pu être chargés.");
      return (await res.json()).pratiques;
    },
  });
}

/** Les variantes de la fiche (D204) : même muscle, un exercice par autre équipement. */
export function variantsOptions(slug: string) {
  return queryOptions({
    queryKey: ["exercises", "variants", slug],
    queryFn: async () => {
      const res = await api.exercices[":slug"].variantes.$get({ param: { slug } });
      if (!res.ok) throw new Error("Les variantes n'ont pas pu être chargées.");
      return (await res.json()).variantes;
    },
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
