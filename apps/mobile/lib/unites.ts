import type { UnitSystem } from "@better-lift/shared";

/**
 * Le système d'unités du mobile — l'unique endroit où il est fixé (D52), comme
 * `apps/web/src/lib/unites.ts` côté web. Le jour où un profil existe, les deux
 * deviennent une lecture du profil.
 */
export const SYSTEME_UNITES: UnitSystem = "metric";

const UNITE_PAR_SYSTEME: Record<UnitSystem, string> = { metric: "kg", imperial: "lb" };

export const UNITE = UNITE_PAR_SYSTEME[SYSTEME_UNITES];
