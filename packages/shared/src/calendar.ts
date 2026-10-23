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

/** L'avance du fuseau sur l'UTC à cet instant, en millisecondes (+2 h l'été à Paris). */
function avanceFuseau(ms: number, fuseau: string): number {
  const parties = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
    timeZone: fuseau,
  }).formatToParts(new Date(ms));
  const p = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parties.find((x) => x.type === type)?.value ?? 0);
  const mural = Date.UTC(p("year"), p("month") - 1, p("day"), p("hour"), p("minute"), p("second"));
  return mural - Math.floor(ms / 1000) * 1000;
}

/**
 * Le même instant, `jours` jours civils plus tard (ou plus tôt), à la même heure
 * murale : une séance de 18 h reste à 18 h de l'autre côté d'un changement
 * d'heure, où ajouter 24 h la décalerait d'une heure.
 */
export function decalerDeJours(iso: string, jours: number, fuseau: string): string {
  const t = Date.parse(iso);
  const brut = t + jours * 86_400_000;
  return new Date(brut + avanceFuseau(t, fuseau) - avanceFuseau(brut, fuseau)).toISOString();
}

/** « 18:12 » : l'heure du fuseau donné, sur 24 heures. */
export function formatHeure(iso: string, fuseau: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: fuseau,
  }).format(new Date(iso));
}

/** « jeudi 23 octobre » ; avec `annee`, « jeudi 23 octobre 2026 ». */
export function formatJourSemaine(iso: string, fuseau: string, annee = false): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(annee ? { year: "numeric" } : {}),
    timeZone: fuseau,
  }).format(new Date(iso));
}

/** « octobre 2026 » : le libellé d'une clé de mois `AAAA-MM`, telle que `parMois` la rend. */
export function formatMois(mois: string): string {
  // Le 15 à midi UTC : le même mois dans tous les fuseaux, la clé est déjà civile.
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${mois}-15T12:00:00.000Z`));
}

/**
 * Les séances groupées par mois civil `AAAA-MM`, dans le fuseau donné — jamais en UTC : le 31 à
 * 23 h 30 à Paris est déjà le 1er en UTC. L'ordre des séances est gardé (la plus récente d'abord).
 */
export function parMois<T extends { debut: string }>(
  seances: readonly T[],
  fuseau: string,
): { mois: string; seances: T[] }[] {
  const groupes: { mois: string; seances: T[] }[] = [];
  for (const s of seances) {
    const mois = cleJour(s.debut, fuseau).slice(0, 7);
    const dernier = groupes.at(-1);
    if (dernier?.mois === mois) dernier.seances.push(s);
    else groupes.push({ mois, seances: [s] });
  }
  return groupes;
}
