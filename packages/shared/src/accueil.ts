import { lundiCourant, semainesRecentes } from "./stats.js";

/**
 * Ce que l'Accueil répond en s'ouvrant (D110) : où en est la semaine, et
 * quelle routine vient ensuite. Pur et sans plateforme ; le découpage des
 * jours se fait dans le fuseau du profil, jamais en UTC.
 */

/**
 * La semaine en cours, du lundi au dimanche dans le fuseau : nombre de séances,
 * volume, jours entraînés (`jours[0]` = lundi) et l'indice d'aujourd'hui.
 */
export function resumeSemaine(
  seances: readonly { debut: string; volumeKg: number }[],
  maintenant: Date,
  fuseau: string,
): { seances: number; volumeKg: number; jours: boolean[]; aujourdhui: number } {
  const [semaine] = semainesRecentes(seances, maintenant, fuseau, 1);
  return {
    seances: semaine?.seances ?? 0,
    volumeKg: semaine?.volumeKg ?? 0,
    jours: semaine?.jours ?? Array(7).fill(false),
    aujourdhui: lundiCourant(maintenant, fuseau).rang,
  };
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
