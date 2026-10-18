import { cleJour, type UnitSystem } from "@better-lift/shared";

/**
 * Le fuseau et les unités du web, fixés ici et nulle part ailleurs (D313). Pas de champ en base
 * (D294) : le fuseau est celui du navigateur, les charges sont en kilos.
 */
const FUSEAU = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const SYSTEME: UnitSystem = "metric";

/**
 * Le jour civil `AAAA-MM-JJ` d'un instant, dans le fuseau du web — jamais en UTC : le samedi
 * 21 h à Paris est déjà dimanche en UTC. C'est ce que lisent les `format*Day` de `format.ts`.
 */
export const jourCivil = (instant: Date | string) =>
  cleJour(new Date(instant).toISOString(), FUSEAU);

/** Les jours civils écoulés depuis un instant, dans le fuseau du web : 0 aujourd'hui, 1 hier. */
export function joursDepuis(instant: Date | string, maintenant: Date = new Date()): number {
  const jour = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  return Math.round((jour(jourCivil(maintenant)) - jour(jourCivil(instant))) / 86_400_000);
}
