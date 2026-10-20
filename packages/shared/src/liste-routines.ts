import { cleJour } from "./calendar.js";
import type { RoutineResume } from "./routines.js";

/**
 * La liste des routines, la même sur le web et le mobile (D320) : rangement par
 * dossier, muscles, durée estimée et dernière fois.
 */

/** Les routines rangées par dossier, dans l'ordre des dossiers ; « Sans dossier » en dernier, s'il a des routines. */
export function parDossier(
  routines: readonly RoutineResume[],
  dossiers: readonly { id: string; nom: string }[],
): { dossier: { id: string; nom: string } | null; routines: RoutineResume[] }[] {
  const connus = new Set(dossiers.map((d) => d.id));
  const groupes = dossiers.map((d) => ({
    dossier: d,
    routines: routines.filter((r) => r.dossierId === d.id),
  }));
  const libres = routines.filter((r) => r.dossierId === null || !connus.has(r.dossierId));
  return libres.length > 0 ? [...groupes, { dossier: null, routines: libres }] : groupes;
}

/** Les muscles d'une routine, sans doublon, dans l'ordre des exercices. */
export const musclesRoutine = (r: RoutineResume): string[] => [
  ...new Set(r.exercices.map((e) => e.musclePrincipal).filter(Boolean)),
];

/** « ~30 min », « ~1 h 05 » : la durée estimée, arrondie aux 5 minutes supérieures. */
export function dureeRoutine(secondes: number): string {
  const minutes = Math.max(5, Math.ceil(secondes / 60 / 5) * 5);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `~${m} min` : `~${h} h ${String(m).padStart(2, "0")}`;
}

/** Les jours civils écoulés depuis un instant, dans le fuseau donné : 0 aujourd'hui, 1 hier. */
export function joursEcoules(
  instant: Date | string,
  fuseau: string,
  maintenant: Date = new Date(),
): number {
  const jour = (d: Date | string) =>
    Date.parse(`${cleJour(new Date(d).toISOString(), fuseau)}T00:00:00Z`);
  return Math.round((jour(maintenant) - jour(instant)) / 86_400_000);
}

/** « Jamais faite », « Aujourd'hui », « Hier », « Il y a 17 j ». */
export function ilYa(jours: number | null): string {
  if (jours === null) return "Jamais faite";
  if (jours === 0) return "Aujourd'hui";
  if (jours === 1) return "Hier";
  return `Il y a ${jours} j`;
}
