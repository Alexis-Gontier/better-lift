/**
 * Arithmétique de dates sur données factices. Les dates sont des chaînes civiles `YYYY-MM-DD`,
 * manipulées en UTC : un jour civil ne glisse jamais d'un fuseau à l'autre. Remplacé par `shared`
 * au branchement de l'API.
 */

const DAY_MS = 86_400_000;

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 1RM estimé (Epley), pour la maquette seulement : elle part aux lots Routines et Historique. */
export function estimate1rm(kg: number, reps: number): number {
  return reps <= 1 ? kg : kg * (1 + reps / 30);
}
