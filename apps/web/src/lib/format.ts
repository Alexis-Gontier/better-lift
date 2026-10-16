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
export const formatKg = (n: number) => `${number.format(n)} kg`;
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
