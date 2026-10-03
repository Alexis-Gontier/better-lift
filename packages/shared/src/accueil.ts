import { cleJour } from "./calendar.js";

/**
 * Ce que l'Accueil répond en s'ouvrant (D110) : où en est la semaine, et
 * quelle routine vient ensuite. Pur et sans plateforme ; le découpage des
 * jours se fait dans le fuseau du profil, jamais en UTC.
 */

const JOUR_MS = 86_400_000;

/** Un jour civil « 2026-10-03 » en millisecondes UTC, pour compter en jours entiers. */
function jourEnMs(cle: string): number {
  const [a, m, j] = cle.split("-").map(Number);
  return Date.UTC(a ?? 0, (m ?? 1) - 1, j ?? 1);
}

/**
 * La semaine en cours, du lundi au dimanche dans le fuseau : nombre de séances,
 * volume, jours entraînés (`jours[0]` = lundi) et l'indice d'aujourd'hui.
 */
export function resumeSemaine(
  seances: readonly { debut: string; volumeKg: number }[],
  maintenant: Date,
  fuseau: string,
): { seances: number; volumeKg: number; jours: boolean[]; aujourdhui: number } {
  const aujourdhuiMs = jourEnMs(cleJour(maintenant.toISOString(), fuseau));
  // getUTCDay : 0 = dimanche. On veut 0 = lundi.
  const aujourdhui = (new Date(aujourdhuiMs).getUTCDay() + 6) % 7;
  const lundiMs = aujourdhuiMs - aujourdhui * JOUR_MS;

  const jours: boolean[] = Array(7).fill(false);
  let nombre = 0;
  let volumeKg = 0;
  for (const s of seances) {
    const i = Math.round((jourEnMs(cleJour(s.debut, fuseau)) - lundiMs) / JOUR_MS);
    if (i < 0 || i > 6) continue;
    jours[i] = true;
    nombre++;
    volumeKg += s.volumeKg;
  }
  return { seances: nombre, volumeKg: Math.round(volumeKg * 100) / 100, jours, aujourdhui };
}

/**
 * La routine « À suivre » : celle qui suit, dans l'ordre de la liste, la
 * dernière routine faite ; la première après la dernière, ou sans historique.
 * Les séances vides et les routines supprimées depuis ne comptent pas.
 */
export function routineASuivre<R extends { id: string }>(
  routines: readonly R[],
  seances: readonly { routineId: string | null; debut: string }[],
): R | null {
  if (routines.length === 0) return null;
  const derniere = [...seances]
    .filter((s) => s.routineId !== null && routines.some((r) => r.id === s.routineId))
    .sort((a, b) => Date.parse(b.debut) - Date.parse(a.debut))[0];
  if (!derniere) return routines[0] ?? null;
  const i = routines.findIndex((r) => r.id === derniere.routineId);
  return routines[(i + 1) % routines.length] ?? null;
}
