import { cleJour } from "./calendar.js";
import { chargeEnTexte, formaterCharge } from "./charge.js";
import { ABREGE_TYPE_SERIE, type RoutineResume, type TypeSerie } from "./routines.js";
import type { UnitSystem } from "./units.js";

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

/** Une série réduite à ses chiffres : la cible d'une routine, ou une saisie déjà lue. */
export type SerieChiffree = { type: TypeSerie; reps: number | null; kg: number | null };

const plage = (valeurs: readonly number[], format: (min: number, max: number) => string) =>
  format(Math.min(...valeurs), Math.max(...valeurs));

/**
 * Le résumé d'un exercice replié (D253, D321) : « 3 × 12 · 10 kg », des plages quand les séries
 * varient (« 3 × 10–12 · 8–10,5 kg »), les échauffements devant (« 1 É + 3 × 12 »). Le web
 * passe « W », son abréviation de l'échauffement.
 */
export function resumeSeries(
  series: readonly SerieChiffree[],
  systeme: UnitSystem,
  echauffement: string = ABREGE_TYPE_SERIE.ECHAUFFEMENT,
): string {
  const echauffements = series.filter((s) => s.type === "ECHAUFFEMENT").length;
  const travail = series.filter((s) => s.type !== "ECHAUFFEMENT");
  if (travail.length === 0) {
    return echauffements > 0 ? `${echauffements} ${echauffement}` : "Aucune série";
  }
  // Une cible peut manquer : on résume ce qui est noté, sans « — » inutile.
  const reps = travail.flatMap((s) => (s.reps === null ? [] : [s.reps]));
  const kgs = travail.flatMap((s) => (s.kg === null ? [] : [s.kg]));
  const nombre =
    reps.length === 0
      ? `${travail.length} série${travail.length > 1 ? "s" : ""}`
      : `${travail.length} × ${plage(reps, (a, b) => (a === b ? `${b}` : `${a}–${b}`))}`;
  const charge =
    kgs.length === 0
      ? ""
      : ` · ${plage(kgs, (a, b) =>
          a === b
            ? formaterCharge(b, systeme)
            : `${chargeEnTexte(a, systeme)}–${formaterCharge(b, systeme)}`,
        )}`;
  return `${echauffements > 0 ? `${echauffements} ${echauffement} + ` : ""}${nombre}${charge}`;
}
