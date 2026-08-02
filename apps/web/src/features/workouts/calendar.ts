/**
 * Grille du calendrier mensuel de l'historique (doc 05, § Historique).
 *
 * ## Pourquoi le fuseau du profil, et pas celui du navigateur
 *
 * Une séance du mardi 22 h 30 à Paris est enregistrée en UTC : `2026-08-04T20:30Z`.
 * Bucketée dans le fuseau du navigateur, elle reste le mardi — sauf pour
 * quelqu'un en déplacement, qui verrait sa séance sauter au mercredi en
 * changeant d'aéroport. Le fuseau du **profil** (`GET /v1/me`) est la seule
 * réponse stable : le calendrier montre les jours tels que l'utilisateur les a
 * vécus, quel que soit l'endroit d'où il consulte.
 *
 * Ce fichier est sans React, donc testable sans monter un composant.
 */

/** Clé de jour, `YYYY-MM-DD`. Comparable par chaîne, ce qui suffit à tout ici. */
export type DayKey = string;

/** Mois affiché, `YYYY-MM`. C'est aussi sa forme dans l'URL. */
export type MonthKey = string;

export interface CalendarDay {
  key: DayKey;
  dayOfMonth: number;
  /** Faux pour les jours de remplissage en début et fin de grille. */
  inMonth: boolean;
  isToday: boolean;
}

/**
 * `en-CA` produit déjà `YYYY-MM-DD` : passer par `formatToParts` évite de
 * dépendre de ce détail, qui n'est garanti par aucune spécification.
 */
function partsInZone(date: Date, timeZone: string): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return { year: find("year"), month: find("month"), day: find("day") };
}

/**
 * Jour d'une date ISO, vu depuis un fuseau donné.
 *
 * Un fuseau invalide — le profil accepte n'importe quelle chaîne de 64
 * caractères — ferait lever `Intl`. On retombe alors sur UTC plutôt que de
 * casser l'écran : un calendrier décalé d'une heure reste lisible, un écran
 * blanc non.
 */
export function dayKeyInZone(iso: string, timeZone: string): DayKey {
  const date = new Date(iso);

  try {
    const { year, month, day } = partsInZone(date, timeZone);

    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function monthKeyOf(day: DayKey): MonthKey {
  return day.slice(0, 7);
}

/** Mois courant vu du fuseau du profil — le mois qu'on ouvre par défaut. */
export function currentMonthKey(timeZone: string, now: Date = new Date()): MonthKey {
  return monthKeyOf(dayKeyInZone(now.toISOString(), timeZone));
}

/**
 * Valide un `?month=` venu de l'URL, qui est une entrée non fiable : tapée,
 * copiée, tronquée. Un mois illisible retombe sur le mois courant plutôt que
 * d'afficher une grille vide sans explication.
 */
export function parseMonthKey(value: string | null, timeZone: string): MonthKey {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return value;
  }

  return currentMonthKey(timeZone);
}

function splitMonth(month: MonthKey): { year: number; monthIndex: number } {
  const [year, monthNumber] = month.split("-").map(Number);

  return { year: year ?? 0, monthIndex: (monthNumber ?? 1) - 1 };
}

/** Mois voisin, `step` valant -1 ou +1. Le passage d'année est géré par `Date`. */
export function shiftMonth(month: MonthKey, step: number): MonthKey {
  const { year, monthIndex } = splitMonth(month);
  const shifted = new Date(Date.UTC(year, monthIndex + step, 1));

  return shifted.toISOString().slice(0, 7);
}

/**
 * Bornes d'un mois pour `GET /v1/workouts`, en **UTC élargi d'un jour de
 * chaque côté**.
 *
 * L'élargissement n'est pas de la paresse : les bornes de l'API portent sur
 * `startedAt` en UTC alors que la grille est découpée dans le fuseau du profil.
 * À Auckland (UTC+13), le 1er du mois commence 13 h avant minuit UTC — une
 * séance du 1er au matin tomberait hors d'une fenêtre calculée strictement, et
 * disparaîtrait du calendrier. Un jour de marge couvre tous les fuseaux
 * habités ; les jours en trop sont écartés au bucketing, qui, lui, connaît le
 * fuseau.
 */
export function monthRange(month: MonthKey): { from: string; to: string } {
  const { year, monthIndex } = splitMonth(month);

  return {
    from: new Date(Date.UTC(year, monthIndex, 0)).toISOString(),
    to: new Date(Date.UTC(year, monthIndex + 1, 2)).toISOString(),
  };
}

/**
 * Grille de six semaines commençant le lundi.
 *
 * Six semaines toujours, même quand cinq suffisent : une grille dont la hauteur
 * change en naviguant fait sauter le bouton « mois suivant » sous le curseur.
 */
export function monthGrid(month: MonthKey, today: DayKey): CalendarDay[] {
  const { year, monthIndex } = splitMonth(month);
  const first = new Date(Date.UTC(year, monthIndex, 1));

  // `getUTCDay` donne 0 pour dimanche : on décale pour une semaine au lundi.
  const leading = (first.getUTCDay() + 6) % 7;
  const days: CalendarDay[] = [];

  for (let offset = 0; offset < 42; offset += 1) {
    const date = new Date(Date.UTC(year, monthIndex, 1 - leading + offset));
    const key = date.toISOString().slice(0, 10);

    days.push({
      key,
      dayOfMonth: date.getUTCDate(),
      inMonth: key.startsWith(month),
      isToday: key === today,
    });
  }

  return days;
}
