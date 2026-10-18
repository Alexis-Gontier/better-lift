import type { UnitSystem } from "@better-lift/shared";

/**
 * Le fuseau et les unités du web, fixés ici et nulle part ailleurs (D313). Pas de champ en
 * base (D294) : le fuseau est celui du navigateur, les charges sont en kilos.
 */
export const FUSEAU = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const SYSTEME: UnitSystem = "metric";
