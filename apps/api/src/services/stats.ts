import { prisma } from "@better-lift/db";
import {
  calculerPeriode,
  type Periode,
  type RecordRecent,
  recordsDe,
  SEMAINES_PERIODE,
  type SerieHisto,
  type Stats,
  type StatsPeriode,
  semainesRecentes,
} from "@better-lift/shared";
import { historique, type LigneSeance, versResume } from "./seances.js";

/**
 * Les statistiques (D112), côté métier. Tout est dérivé des séances, à la
 * lecture (D58) : rien n'est stocké, rien n'est à recalculer quand une séance
 * arrive. Ce module ne connaît pas Hono.
 */

const JOUR_MS = 86_400_000;
/** Les semaines affichées : 8 pour le volume, 12 pour la régularité. */
const SEMAINES = 12;
/** La fenêtre des records récents et de la carte du corps. */
const FENETRE_JOURS = 28;

/**
 * Les records établis depuis une date, du plus récent au plus ancien, bornés
 * à `n`. Chaque exercice porte son historique chronologique COMPLET : un record
 * se juge contre tout ce qui le précède, même avant la fenêtre (D64).
 */
export function recordsRecents(
  exercices: readonly {
    slug: string;
    nom: string;
    historique: (SerieHisto & { date: string })[];
  }[],
  depuis: Date,
  n = 5,
): RecordRecent[] {
  const lignes: RecordRecent[] = [];
  for (const e of exercices) {
    // Une série qui bat plusieurs records en porte plusieurs types : une ligne.
    const parSerie = new Map<string, RecordRecent>();
    for (const r of recordsDe(e.historique)) {
      if (Date.parse(r.date) < depuis.getTime()) continue;
      const cle = `${r.date}|${r.reps}|${r.chargeKg}`;
      const ligne = parSerie.get(cle);
      if (ligne) ligne.types.push(r.type);
      else
        parSerie.set(cle, {
          slug: e.slug,
          nom: e.nom,
          types: [r.type],
          reps: r.reps,
          chargeKg: r.chargeKg,
          date: r.date,
        });
    }
    lignes.push(...parSerie.values());
  }
  return lignes.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, n);
}

export type DepotStats = {
  lire(userId: string, maintenant: Date, fuseau: string): Promise<Stats>;
  /** Les stats d'une période et de la période d'avant (D125). */
  lirePeriode(
    userId: string,
    maintenant: Date,
    fuseau: string,
    periode: Periode,
  ): Promise<StatsPeriode>;
};

export const depotStats: DepotStats = {
  async lirePeriode(userId, maintenant, fuseau, periode) {
    // Deux périodes et une semaine de marge : le découpage civil se fait ensuite.
    const semaines = 2 * SEMAINES_PERIODE[periode] + 1;
    const debut = new Date(maintenant.getTime() - semaines * 7 * JOUR_MS);
    const [nbSeances, lignes] = await Promise.all([
      prisma.seance.count({ where: { userId } }),
      prisma.seance.findMany({
        where: { userId, debut: { gte: debut } },
        select: {
          id: true,
          nom: true,
          routineId: true,
          debut: true,
          fin: true,
          note: true,
          exercices: {
            select: {
              exerciseId: true,
              exercise: {
                select: { slug: true, nomFr: true, gifUrl: true, target: true, secondary: true },
              },
              note: true,
              series: { select: { type: true, reps: true, chargeKg: true, faite: true } },
            },
          },
        },
      }),
    ]);

    const p = calculerPeriode(
      lignes.map((l) => {
        const resume = versResume(l as LigneSeance);
        return {
          id: l.id,
          debut: resume.debut,
          fin: resume.fin,
          volumeKg: resume.volumeKg,
          seriesFaites: resume.seriesFaites,
          exercices: l.exercices.map((e) => ({
            musclePrincipal: e.exercise.target,
            musclesSecondaires: e.exercise.secondary,
            seriesComptees: e.series.filter((s) => s.faite && s.type !== "ECHAUFFEMENT").length,
          })),
        };
      }),
      maintenant,
      fuseau,
      periode,
    );

    // Les records de la période : chaque série se juge contre TOUT ce qui la
    // précède (D64), d'où l'historique complet des exercices de la période.
    const dansPeriode = new Set(p.jours.flatMap((j) => j.seances));
    const courantes = lignes.filter((l) => dansPeriode.has(l.id));
    const exercices = new Map<string, { slug: string; nom: string }>();
    for (const l of courantes) {
      for (const e of l.exercices) {
        exercices.set(e.exerciseId, { slug: e.exercise.slug, nom: e.exercise.nomFr });
      }
    }
    const depuis = new Date(
      Math.min(...courantes.map((l) => l.debut.getTime()), maintenant.getTime()),
    );
    const h = await historique(userId, [...exercices.keys()]);
    const records = recordsRecents(
      [...exercices].map(([id, e]) => ({ ...e, historique: h.get(id) ?? [] })),
      depuis,
      10,
    );
    return { ...p, records, nbSeances };
  },

  async lire(userId, maintenant, fuseau) {
    // Une semaine de marge : le découpage civil, dans le fuseau, se fait ensuite.
    const debut = new Date(maintenant.getTime() - (SEMAINES + 1) * 7 * JOUR_MS);
    const depuis = new Date(maintenant.getTime() - FENETRE_JOURS * JOUR_MS);
    const [nbSeances, lignes] = await Promise.all([
      prisma.seance.count({ where: { userId } }),
      prisma.seance.findMany({
        where: { userId, debut: { gte: debut } },
        select: {
          id: true,
          nom: true,
          routineId: true,
          debut: true,
          fin: true,
          // Lue pour la forme `LigneSeance`, sans usage ici.
          note: true,
          exercices: {
            select: {
              exerciseId: true,
              exercise: {
                select: { slug: true, nomFr: true, gifUrl: true, target: true, secondary: true },
              },
              note: true,
              series: { select: { type: true, reps: true, chargeKg: true, faite: true } },
            },
          },
        },
      }),
    ]);

    const semaines = semainesRecentes(
      lignes.map((l) => ({
        debut: l.debut.toISOString(),
        volumeKg: versResume(l as LigneSeance).volumeKg,
      })),
      maintenant,
      fuseau,
      SEMAINES,
    );

    // Les exercices des 4 dernières semaines, une fois chacun.
    const recents = new Map<
      string,
      { slug: string; nom: string; target: string; secondary: string[] }
    >();
    for (const l of lignes) {
      if (l.debut < depuis) continue;
      for (const e of l.exercices) {
        recents.set(e.exerciseId, {
          slug: e.exercise.slug,
          nom: e.exercise.nomFr,
          target: e.exercise.target,
          secondary: e.exercise.secondary,
        });
      }
    }
    const h = await historique(userId, [...recents.keys()]);

    return {
      nbSeances,
      semaines,
      recordsRecents: recordsRecents(
        [...recents].map(([id, e]) => ({ slug: e.slug, nom: e.nom, historique: h.get(id) ?? [] })),
        depuis,
      ),
      muscles: [...recents.values()].map((e) => ({
        musclePrincipal: e.target,
        musclesSecondaires: e.secondary,
      })),
    };
  },
};
