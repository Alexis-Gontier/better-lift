import type { Groupe } from "@better-lift/shared";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { api, lire } from "./api";

/**
 * Le catalogue d'exercices, lu page par page avec recherche et filtres côté serveur. Commun à
 * la page Exercices et au sélecteur de l'éditeur de routine : il vit hors des features (D306).
 */

export type FiltresCatalogue = { q?: string; groupe?: Groupe; equipement?: string };

/** Les équipements du catalogue qui comptent au moins dix exercices, du plus fréquent au moins. */
export const EQUIPEMENTS = [
  "Poids du corps",
  "Haltères",
  "Poulie",
  "Barre",
  "Machine à levier",
  "Élastique",
  "Smith machine",
  "Kettlebell",
  "Lesté",
  "Swiss ball",
  "Barre EZ",
  "Machine guidée",
  "Assisté",
  "Médecine-ball",
  "Corde",
] as const;

const TAILLE = 50;

/** La recherche RPC n'accepte que des chaînes : les filtres absents ne sont pas envoyés. */
function requete(f: FiltresCatalogue, page: number) {
  return {
    page: String(page),
    taille: String(TAILLE),
    ...(f.q?.trim() ? { q: f.q.trim() } : {}),
    ...(f.groupe ? { groupe: f.groupe } : {}),
    ...(f.equipement ? { equipement: f.equipement } : {}),
  };
}

const catalogueKeys = {
  all: ["catalogue"] as const,
  liste: (f: FiltresCatalogue) => ["catalogue", "liste", f] as const,
};

export const catalogueQuery = (f: FiltresCatalogue) =>
  infiniteQueryOptions({
    queryKey: catalogueKeys.liste(f),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await lire(
        () => api.exercices.$get({ query: requete(f, pageParam) }),
        "Le catalogue n'a pas pu être chargé.",
      );
      return res.json();
    },
    getNextPageParam: (p) => (p.page * p.taille < p.total ? p.page + 1 : undefined),
    // Le catalogue ne change pas pendant une visite.
    staleTime: 10 * 60_000,
  });
