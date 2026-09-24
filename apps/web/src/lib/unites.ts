import type { UnitSystem } from "@better-lift/shared";

/**
 * Le système d'unités affiché — l'UNIQUE endroit où il est fixé (D52).
 *
 * Aucun profil n'existe encore. Le jour où il arrive, cette constante devient
 * une lecture du profil, et aucun écran n'a à changer : tous passent par
 * `formaterCharge` et `lireCharge` avec cette valeur.
 */
export const SYSTEME_UNITES: UnitSystem = "metric";
