import { cleJour } from "./calendar.js";
import { type HistoriqueExercice, REPS_MAX_1RM, type SerieHisto } from "./records.js";
import { estimate1RM } from "./training.js";

/**
 * L'analyse d'un exercice sur sa fiche (D202, D203), dérivée de l'historique que rend
 * l'API (`/exercices/:slug/historique`) : rien n'est stocké. Ne comptent que les séries
 * FAITES, hors échauffement, d'au moins une rep — comme les records.
 */

export const PERIODES_EXERCICE = ["1m", "3m", "6m", "1a", "tout"] as const;
export type PeriodeExercice = (typeof PERIODES_EXERCICE)[number];

const MOIS: Record<Exclude<PeriodeExercice, "tout">, number> = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "1a": 12,
};

/** Les lignes du tableau des meilleures séries (D203). */
export const REPS_TABLEAU = [1, 3, 5, 6, 8, 10, 12] as const;

export type PointSeance = {
  date: string;
  /** La plus lourde série comptée ; `null` au poids du corps. */
  chargeMax: number | null;
  /** Le meilleur 1RM estimé de la séance (Epley, ≤ 12 reps) ; `null` au poids du corps. */
  unRm: number | null;
  volume: number;
  reps: number;
  series: number;
};

type Comptee = SerieHisto & { reps: number };

function comptees(series: SerieHisto[]): Comptee[] {
  return series.filter(
    (s): s is Comptee => s.faite && s.type !== "ECHAUFFEMENT" && s.reps !== null && s.reps > 0,
  );
}

/**
 * Le premier jour civil de la période (« 2026-07-01 »), dans le fuseau ; `null` pour
 * « tout ». Les mois reculent en calendrier civil : le 31 recule au dernier jour du mois.
 */
export function debutPeriode(
  periode: PeriodeExercice,
  maintenant: string,
  fuseau: string,
): string | null {
  if (periode === "tout") return null;
  const [a, m, j] = cleJour(maintenant, fuseau).split("-").map(Number) as [number, number, number];
  const total = a * 12 + (m - 1) - MOIS[periode];
  const annee = Math.floor(total / 12);
  const mois = (total % 12) + 1;
  const dernierJour = new Date(Date.UTC(annee, mois, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${annee}-${pad(mois)}-${pad(Math.min(j, dernierJour))}`;
}

/** Un point par séance de la période, du plus ancien au plus récent (D202). */
export function pointsExercice(
  historique: HistoriqueExercice,
  periode: PeriodeExercice,
  maintenant: string,
  fuseau: string,
): PointSeance[] {
  const debut = debutPeriode(periode, maintenant, fuseau);
  const points: PointSeance[] = [];
  for (const seance of [...historique].reverse()) {
    if (debut && cleJour(seance.debut, fuseau) < debut) continue;
    const series = comptees(seance.series);
    if (series.length === 0) continue;
    const chargees = series.filter((s) => s.chargeKg !== null) as (Comptee & {
      chargeKg: number;
    })[];
    const pourRm = chargees.filter((s) => s.reps <= REPS_MAX_1RM);
    points.push({
      date: seance.debut,
      chargeMax: chargees.length ? Math.max(...chargees.map((s) => s.chargeKg)) : null,
      unRm: pourRm.length ? Math.max(...pourRm.map((s) => estimate1RM(s.chargeKg, s.reps))) : null,
      volume: Math.round(chargees.reduce((v, s) => v + s.chargeKg * s.reps, 0) * 100) / 100,
      reps: series.reduce((r, s) => r + s.reps, 0),
      series: series.length,
    });
  }
  return points;
}

/** Le résumé de la période (D202). */
export function resumePeriode(points: PointSeance[]) {
  const volume = Math.round(points.reduce((v, p) => v + p.volume, 0) * 100) / 100;
  return {
    seances: points.length,
    series: points.reduce((n, p) => n + p.series, 0),
    reps: points.reduce((n, p) => n + p.reps, 0),
    volume,
    volumeMoyen: points.length ? Math.round(volume / points.length) : 0,
  };
}

/** Vrai si une série comptée porte une charge : sinon, ni charge max ni 1RM à montrer. */
export function avecCharge(historique: HistoriqueExercice): boolean {
  return historique.some((s) => comptees(s.series).some((x) => x.chargeKg !== null));
}

export type MeilleureParReps = {
  reps: number;
  /** La meilleure charge faite à CE nombre exact de reps, et sa première date. */
  realise: { chargeKg: number; date: string } | null;
  /** Ce que le meilleur 1RM laisse viser à ce nombre de reps (Epley inversé), au 0,5 près. */
  estimeKg: number | null;
};

/** Les meilleures séries par reps, depuis toujours (D203) : la période ne s'y applique pas. */
export function meilleuresParReps(historique: HistoriqueExercice): MeilleureParReps[] {
  const realises = new Map<number, { chargeKg: number; date: string }>();
  let meilleurRm = 0;
  // Du plus ancien au plus récent : une égalité garde la première date.
  for (const seance of [...historique].reverse()) {
    for (const s of comptees(seance.series)) {
      if (s.chargeKg === null) continue;
      const actuel = realises.get(s.reps);
      if (!actuel || s.chargeKg > actuel.chargeKg) {
        realises.set(s.reps, { chargeKg: s.chargeKg, date: seance.debut });
      }
      if (s.reps <= REPS_MAX_1RM)
        meilleurRm = Math.max(meilleurRm, estimate1RM(s.chargeKg, s.reps));
    }
  }
  return REPS_TABLEAU.map((reps) => ({
    reps,
    realise: realises.get(reps) ?? null,
    estimeKg:
      meilleurRm === 0
        ? null
        : reps === 1
          ? meilleurRm
          : Math.round((meilleurRm / (1 + reps / 30)) * 2) / 2,
  }));
}
