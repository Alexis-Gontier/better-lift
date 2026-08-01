import { type BodyPart } from "@better-lift/validators";

/**
 * Libellés d'affichage du catalogue.
 *
 * Ils sont dupliqués entre le web et le mobile plutôt que partagés : seuls
 * `core`, `validators` et `api-client` traversent la frontière (règle non
 * négociable n°2), et une table de libellés n'est ni de la logique métier ni un
 * contrat. La duplication porte sur une dizaine de lignes ; la partager
 * imposerait un paquet de présentation commun, c'est-à-dire précisément la
 * pente qu'on refuse.
 *
 * L'i18n réelle des **données** est déjà faite côté serveur : le nom et les
 * instructions arrivent dans la locale du profil (`?locale=`). Ce qui reste ici
 * est la chrome de l'interface, aujourd'hui en français comme le reste de
 * l'application.
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

/**
 * L'équipement est une **chaîne libre** du dataset, pas une énumération : l'API
 * accepte n'importe quelle valeur. Cette liste n'est donc pas un contrat, c'est
 * un raccourci d'interface sur les huit valeurs qui couvrent l'essentiel du
 * catalogue — la longue traîne (`tire`, `skierg_machine`…) reste atteignable
 * par la recherche.
 *
 * Les valeurs sont en `snake_case` parce que c'est ainsi que le seed les
 * normalise (`normalizeEquipment` remplace les espaces par des tirets bas). Le
 * filtre de l'API compare la chaîne telle quelle : un `body weight` avec une
 * espace ne ramènerait rien, silencieusement.
 */
export const EQUIPMENT_FILTERS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "body_weight", label: "Poids du corps" },
  { value: "dumbbell", label: "Haltères" },
  { value: "barbell", label: "Barre" },
  { value: "cable", label: "Poulie" },
  { value: "leverage_machine", label: "Machine" },
  { value: "smith_machine", label: "Smith" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "band", label: "Élastique" },
];

const EQUIPMENT_LABELS = new Map(EQUIPMENT_FILTERS.map((entry) => [entry.value, entry.label]));

/**
 * Repli pour tout ce que la liste ne couvre pas : la valeur brute, ses tirets
 * bas rendus à l'espace. `stability_ball` se lit mieux en « stability ball »
 * qu'en identifiant technique, même sans traduction.
 */
export function equipmentLabel(value: string): string {
  return EQUIPMENT_LABELS.get(value) ?? value.replaceAll("_", " ");
}
