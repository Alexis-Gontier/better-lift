/**
 * Arithmétique de dates sur données factices. Les dates sont des chaînes civiles `YYYY-MM-DD`,
 * manipulées en UTC : un jour civil ne glisse jamais d'un fuseau à l'autre. Remplacé par `shared`
 * au branchement de l'API.
 */

const DAY_MS = 86_400_000;

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}
