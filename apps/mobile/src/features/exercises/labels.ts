import { type BodyPart } from "@better-lift/validators";

/**
 * Libellés d'affichage du catalogue.
 *
 * Le jumeau de `apps/web/src/features/exercises/labels.ts`, dupliqué à dessein :
 * seuls `core`, `validators` et `api-client` traversent la frontière web /
 * mobile (règle non négociable n°2), et une table de libellés n'est ni de la
 * logique métier ni un contrat. La partager imposerait un paquet de
 * présentation commun — la pente exacte que cette règle refuse.
 *
 * L'i18n des **données** est déjà faite côté serveur : nom et instructions
 * arrivent dans la locale du profil.
 */
export const BODY_PART_LABELS: Record<BodyPart, string> = {
  CHEST: "Pectoraux",
  BACK: "Dos",
  SHOULDERS: "Épaules",
  UPPER_ARMS: "Bras",
  LOWER_ARMS: "Avant-bras",
  UPPER_LEGS: "Cuisses",
  LOWER_LEGS: "Mollets",
  WAIST: "Abdominaux",
  CARDIO: "Cardio",
  NECK: "Cou",
};

const EQUIPMENT_LABELS = new Map([
  ["body_weight", "Poids du corps"],
  ["dumbbell", "Haltères"],
  ["barbell", "Barre"],
  ["cable", "Poulie"],
  ["leverage_machine", "Machine"],
  ["smith_machine", "Smith"],
  ["kettlebell", "Kettlebell"],
  ["band", "Élastique"],
]);

/**
 * L'équipement est une chaîne libre du dataset, normalisée en `snake_case` au
 * seed. Le repli rend les tirets bas à l'espace : `stability_ball` se lit mieux
 * en « stability ball » qu'en identifiant technique, même sans traduction.
 */
export function equipmentLabel(value: string): string {
  return EQUIPMENT_LABELS.get(value) ?? value.replaceAll("_", " ");
}
