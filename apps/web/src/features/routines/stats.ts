import {
  type Brouillon,
  dureeEstimeeSec,
  lireCharge,
  type SeanceResume,
} from "@better-lift/shared";
import { SYSTEME } from "@/lib/locale";

/** Les calculs propres aux Routines du web (D307), sur les types de l'API et du brouillon. */

/** La durée estimée d'un brouillon, en minutes, arrondie aux 5 supérieures ; `shared` la calcule. */
export function minutesEstimees(b: Brouillon): number {
  const sec = dureeEstimeeSec(
    b.exercices.map((e) => ({
      reposSec: /^\d+$/.test(e.repos.trim()) ? Number(e.repos) : null,
      series: e.series,
    })),
  );
  return Math.ceil(sec / 60 / 5) * 5;
}

/** Charge × répétitions de toutes les séries notées. */
export function volumePrevu(b: Brouillon): number {
  let total = 0;
  for (const e of b.exercices)
    for (const s of e.series) {
      const kg = lireCharge(s.charge, SYSTEME);
      const reps = /^\d+$/.test(s.reps.trim()) ? Number(s.reps) : 0;
      if (kg !== null && !Number.isNaN(kg)) total += kg * reps;
    }
  return Math.round(total * 100) / 100;
}

/** Les muscles à colorer : principaux, puis secondaires qui ne le sont pas déjà. */
export function musclesRoutine(
  exercices: readonly { musclePrincipal: string; musclesSecondaires: readonly string[] }[],
): { primary: string[]; secondary: string[] } {
  const primary = new Set(exercices.map((e) => e.musclePrincipal).filter(Boolean));
  const secondary = new Set(exercices.flatMap((e) => e.musclesSecondaires));
  return { primary: [...primary], secondary: [...secondary].filter((m) => !primary.has(m)) };
}

/** « Nouveau dossier », « Nouveau dossier 2 »… : un nom qui n'est pas pris. */
export function nomLibre(base: string, pris: readonly string[]): string {
  if (!pris.includes(base)) return base;
  let n = 2;
  while (pris.includes(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

/** L'écart en % entre la première et la dernière valeur non nulle ; moins de deux : rien à dire. */
export function tendance(valeurs: readonly number[]): number | null {
  const utiles = valeurs.filter((v) => v > 0);
  const premiere = utiles[0];
  const derniere = utiles.at(-1);
  if (premiere === undefined || derniere === undefined || utiles.length < 2) return null;
  return ((derniere - premiere) / premiere) * 100;
}

/**
 * La routine dans le temps (D280, D311) : sur ses séances depuis `depuis` (ISO), le nombre, les
 * moyennes de volume et de durée, les records battus et la réalisation — séries faites sur
 * séries prévues hors échauffement, plafonnée à 1. `null` sans séance.
 */
export function statsRoutine(prevues: number, seances: readonly SeanceResume[], depuis: string) {
  const runs = seances
    .filter((s) => s.debut >= depuis)
    .sort((a, b) => a.debut.localeCompare(b.debut));
  if (runs.length === 0) return null;
  const moyenne = (f: (s: SeanceResume) => number) =>
    runs.reduce((n, s) => n + f(s), 0) / runs.length;
  return {
    nb: runs.length,
    volumeMoyen: moyenne((s) => s.volumeKg),
    tendanceVolume: tendance(runs.map((s) => s.volumeKg)),
    dureeMoyenneMin: moyenne((s) => (Date.parse(s.fin) - Date.parse(s.debut)) / 60_000),
    records: runs.reduce((n, s) => n + s.nbRecords, 0),
    realisation: prevues > 0 ? moyenne((s) => Math.min(1, s.seriesFaites / prevues)) : 1,
  };
}

/** Les séries prévues d'une routine, hors échauffement : le dénominateur de la réalisation. */
export const seriesPrevues = (b: Brouillon) =>
  b.exercices.reduce((n, e) => n + e.series.filter((s) => s.type !== "ECHAUFFEMENT").length, 0);
