/**
 * Les groupes musculaires, et eux seuls.
 *
 * D41 : `bodyPart` reste une enum anglaise en base — c'est une clé de données,
 * elle sert aux filtres, aux index et aux URL, et elle ne doit pas bouger parce
 * qu'un libellé bouge. Seul l'affichage est français.
 *
 * L'union est REDÉCLARÉE ici plutôt qu'importée de Prisma : `shared` n'a pas le
 * droit d'importer Prisma (règle d'architecture), sans quoi le mobile et le web
 * traîneraient le client de base de données. Le pont avec l'enum réelle est tenu
 * par un test de `packages/db` qui relit `schema.prisma` — voir
 * `packages/db/catalogue/source.test.ts`.
 *
 * `Record<Groupe, string>` fait le reste : ajouter une valeur à `GROUPES` sans
 * lui donner de libellé ne compile pas.
 */
export const GROUPES = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "UPPER_ARMS",
  "LOWER_ARMS",
  "UPPER_LEGS",
  "LOWER_LEGS",
  "WAIST",
  "CARDIO",
  "NECK",
] as const;

export type Groupe = (typeof GROUPES)[number];

export const LIBELLE_GROUPE: Record<Groupe, string> = {
  CHEST: "Pectoraux",
  BACK: "Dos",
  SHOULDERS: "Épaules",
  UPPER_ARMS: "Bras",
  LOWER_ARMS: "Avant-bras",
  UPPER_LEGS: "Cuisses",
  LOWER_LEGS: "Mollets",
  WAIST: "Abdominaux",
  CARDIO: "Cardio",
  NECK: "Nuque",
};
