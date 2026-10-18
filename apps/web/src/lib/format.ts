const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const day = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const shortDay = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Les dates sont des jours civils `YYYY-MM-DD` : formatées en UTC, elles ne glissent pas. */
const asDate = (date: string) => new Date(`${date}T00:00:00Z`);

export const formatNumber = (n: number) => number.format(n);
/** « 1 séance », « 2 séances » : le nom au pluriel au-delà de un. */
export const plural = (n: number, word: string) => `${number.format(n)} ${word}${n > 1 ? "s" : ""}`;
export const formatKg = (n: number) => `${number.format(n)} kg`;
/** La charge d'une série : « — » si elle n'a pas été notée, « Poids du corps » à 0 kg. */
export const formatLoad = (kg: number | null) =>
  kg === null ? "—" : kg === 0 ? "Poids du corps" : formatKg(kg);
export const formatDay = (date: string) => day.format(asDate(date));
export const formatShortDay = (date: string) => shortDay.format(asDate(date));

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m} min` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Écart signé : « +2 », « −8 % ». */
export function formatDelta(current: number, previous: number, percent = false): string {
  const diff = percent
    ? previous === 0
      ? 0
      : ((current - previous) / previous) * 100
    : current - previous;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  return `${sign}${number.format(Math.abs(Math.round(diff)))}${percent ? " %" : ""}`;
}

/** « Aujourd'hui », « Hier », « Il y a 5 j », ou « Jamais faite ». */
export function formatDaysAgo(days: number | null): string {
  if (days === null) return "Jamais faite";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `Il y a ${days} j`;
}

/** « 1 min 30 », « 2 min », « 45 s ». */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m} min ${String(s).padStart(2, "0")}`;
}

const monthYear = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const weekdayDay = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** « octobre 2026 » pour un mois `YYYY-MM`. */
export const formatMonth = (month: string) => monthYear.format(asDate(`${month}-01`));
/** « jeu. 15 oct. » */
export const formatWeekdayDay = (date: string) => weekdayDay.format(asDate(date));

const precise = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
/** Deux décimales : un disque de 1,25 kg ne s'arrondit pas à 1,3. */
export const formatPrecise = (n: number) => precise.format(n);

/** Les initiales d'un nom : « Alexis Gontier » → « AG ». */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
