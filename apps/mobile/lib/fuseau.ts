/**
 * Le fuseau où se découpent les jours du mobile — l'unique endroit où il est
 * fixé, comme `apps/web/src/lib/fuseau.ts`. Jamais UTC : le samedi 21 h à
 * Paris est déjà dimanche en UTC.
 */
export const FUSEAU = "Europe/Paris";
