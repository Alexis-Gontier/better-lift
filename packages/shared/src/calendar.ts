/**
 * Arithmétique civile : tout découpage temporel se fait dans le fuseau du
 * profil, jamais en UTC. `Intl` est la seule dépendance tolérée ici.
 *
 * Le piège, déjà payé une fois : une séance du samedi 23 h 30 à Paris est déjà
 * dimanche en UTC. Découper sur l'horodatage brut la fait changer de jour, de
 * semaine, et fausse tout ce qui s'agrège par jour civil.
 */

export function formatJour(iso: string, fuseau: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: fuseau,
  }).format(new Date(iso));
}

/** La clé de jour civil : « 2026-09-20 » dans le fuseau donné. */
export function cleJour(iso: string, fuseau: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: fuseau,
  }).format(new Date(iso));
}

export function memeJour(a: string, b: string, fuseau: string): boolean {
  return cleJour(a, fuseau) === cleJour(b, fuseau);
}
