"use client";

import { metersToMiles, toDisplayWeight, toNumber, weightUnitLabel } from "@better-lift/core";

import { useProfileLocale } from "./use-profile-locale";
import { useProfileUnits } from "./use-profile-units";

/**
 * Affichage des grandeurs mesurées (doc 05, § Affichage des unités).
 *
 * **C'est le seul fichier du web qui convertit des unités.** La règle n'est pas
 * cosmétique : dès qu'un écran fait la conversion à la main, un autre l'oublie,
 * et l'application finit en kg dans l'historique pendant qu'elle est en lb dans
 * la fiche exercice. Le composant lit la préférence et la locale du profil,
 * personne d'autre n'a à y penser.
 *
 * L'API sert des `Decimal` en chaînes (`"82.50"`, doc 04) : on les passe telles
 * quelles, `toDisplayWeight` s'en charge. Aucun `parseFloat` ici — la
 * conversion appartient à `packages/core` (règle non négociable n°4).
 */
export function Weight({
  value,
  /**
   * Le suffixe se coupe dans un tableau dont l'en-tête porte déjà l'unité :
   * répéter « kg » quinze fois dans une colonne n'informe personne et vole la
   * place aux chiffres, qui sont ce qu'on vient lire.
   */
  unit = true,
  /** Ce qu'on montre en l'absence de charge — au poids du corps, par exemple. */
  fallback = "—",
}: {
  value: string | number | null | undefined;
  unit?: boolean;
  fallback?: string;
}) {
  const locale = useProfileLocale();
  const system = useProfileUnits();

  if (value === null || value === undefined) {
    return <>{fallback}</>;
  }

  const converted = toDisplayWeight(value, system);
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(converted);

  return <>{unit ? `${formatted} ${weightUnitLabel(system)}` : formatted}</>;
}

/**
 * Le libellé d'unité seul, pour un en-tête de colonne.
 *
 * Il existe parce que `<Weight unit={false} />` a besoin d'un pendant : sans
 * lui, l'en-tête serait écrit « kg » en dur et mentirait pour un profil
 * impérial — exactement la dérive que le composant sert à empêcher.
 */
export function useWeightUnitLabel(): "kg" | "lb" {
  return weightUnitLabel(useProfileUnits());
}

/**
 * Même contrat que `<Weight>`, pour les distances.
 *
 * Elles sont stockées en **mètres** (règle non négociable n°3) et s'affichent
 * en miles pour un profil impérial. Un composant séparé plutôt qu'une option de
 * `<Weight>` : ce sont deux grandeurs, et un `<Weight kind="distance" />`
 * finirait par se tromper de conversion un jour.
 */
export function Distance({
  value,
  unit = true,
  fallback = "—",
}: {
  value: string | number | null | undefined;
  unit?: boolean;
  fallback?: string;
}) {
  const locale = useProfileLocale();
  const system = useProfileUnits();

  if (value === null || value === undefined) {
    return <>{fallback}</>;
  }

  const imperial = system === "IMPERIAL";
  const converted = imperial ? metersToMiles(value) : toNumber(value);
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: imperial ? 2 : 0,
  }).format(converted);

  return <>{unit ? `${formatted} ${imperial ? "mi" : "m"}` : formatted}</>;
}

/** Le pendant de `useWeightUnitLabel` pour un en-tête de colonne de distance. */
export function useDistanceUnitLabel(): "m" | "mi" {
  return useProfileUnits() === "IMPERIAL" ? "mi" : "m";
}
