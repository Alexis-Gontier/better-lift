import { cleJour } from "@better-lift/shared";

/**
 * Le fuseau du web, fixé ici et nulle part ailleurs (D313). Pas de champ en base (D294) : c'est
 * celui du navigateur. Les unités (kilos) s'y ajouteront avec la première charge lue de l'API.
 */
const FUSEAU = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Le jour civil `AAAA-MM-JJ` d'un instant, dans le fuseau du web — jamais en UTC : le samedi
 * 21 h à Paris est déjà dimanche en UTC. C'est ce que lisent les `format*Day` de `format.ts`.
 */
export const jourCivil = (instant: Date | string) =>
  cleJour(new Date(instant).toISOString(), FUSEAU);
