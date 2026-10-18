/**
 * Calculs de l'Accueil sur données factices. Les dates sont des chaînes civiles
 * `YYYY-MM-DD`, manipulées en UTC : un jour civil ne glisse jamais d'un fuseau à l'autre.
 * Ces calculs seront remplacés par ceux de `shared` au branchement de l'API.
 */

export type SessionLike = { date: string; volume: number; minutes: number };

const DAY_MS = 86_400_000;

function toUtc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** Le lundi de la semaine de `date`. */
export function startOfWeek(date: string): string {
  const weekday = (new Date(toUtc(date)).getUTCDay() + 6) % 7; // lundi = 0
  return addDays(date, -weekday);
}

/** Volume des `weeks` dernières semaines, la plus ancienne d'abord. */
export function weeklyVolume(sessions: SessionLike[], today: string, weeks: number) {
  const last = startOfWeek(today);
  return Array.from({ length: weeks }, (_, i) => {
    const week = addDays(last, (i - weeks + 1) * 7);
    const volume = sessions
      .filter((s) => startOfWeek(s.date) === week)
      .reduce((sum, s) => sum + s.volume, 0);
    return { week, volume };
  });
}

/** Le nombre d'éléments par semaine sur les `weeks` dernières, la plus ancienne d'abord. */
export function weeklyCount(items: readonly { date: string }[], today: string, weeks: number) {
  const last = startOfWeek(today);
  return Array.from({ length: weeks }, (_, i) => {
    const week = addDays(last, (i - weeks + 1) * 7);
    return { week, count: items.filter((x) => startOfWeek(x.date) === week).length };
  });
}

/** Semaines consécutives avec au moins un élément, en partant de la semaine en cours si elle compte. */
export function weekStreak(items: readonly { date: string }[], today: string): number {
  const weeks = new Set(items.filter((s) => s.date <= today).map((s) => startOfWeek(s.date)));
  let week = startOfWeek(today);
  if (!weeks.has(week)) week = addDays(week, -7);
  let streak = 0;
  while (weeks.has(week)) {
    streak += 1;
    week = addDays(week, -7);
  }
  return streak;
}

/** Un élément par jour sur `days` jours jusqu'à `today` ; niveau 0 à 4 relatif au jour le plus chargé. */
export function dailyActivity(sessions: SessionLike[], today: string, days: number) {
  const byDay = new Map<string, number>();
  for (const s of sessions) byDay.set(s.date, (byDay.get(s.date) ?? 0) + s.volume);
  const max = Math.max(1, ...byDay.values());
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1);
    const volume = byDay.get(date) ?? 0;
    const level = volume === 0 ? 0 : Math.max(1, Math.round((volume / max) * 4));
    return { date, count: volume > 0 ? 1 : 0, level };
  });
}

/** Moyenne glissante sur les `window` dernières valeurs disponibles à chaque point. */
export function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}
