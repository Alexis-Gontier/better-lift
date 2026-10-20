import { prisma } from "@better-lift/db";
import { type FaitSeance, type TableauDeBord, type Zone, zoneDuMuscle } from "@better-lift/shared";
import { depotPreferences } from "./preferences.js";
import { anterieurA, historique, LECTURE_SEANCE, versDetail } from "./seances.js";

export type DepotTableauDeBord = {
  /** Les faits des séances depuis `depuis`, la plus récente d'abord, et le contexte de l'Accueil. */
  lire(userId: string, depuis: Date): Promise<TableauDeBord>;
};

/**
 * Le tableau de bord (D330). Les records se rejouent sur TOUT l'historique des exercices (D64) —
 * un record se juge contre tout le passé, pas contre la seule période — par `versDetail`, comme
 * le détail d'une séance. Ce module ne connaît pas Hono.
 */
export const depotTableauDeBord: DepotTableauDeBord = {
  async lire(userId, depuis) {
    const [lignes, muscles, total, preferences] = await Promise.all([
      prisma.seance.findMany({
        where: { userId, debut: { gte: depuis } },
        orderBy: { debut: "desc" },
        select: LECTURE_SEANCE,
      }),
      // Les muscles des exercices de la période, à part : `LECTURE_SEANCE` reste celle du détail.
      prisma.seanceExercice.findMany({
        where: { seance: { userId, debut: { gte: depuis } } },
        select: { exercise: { select: { id: true, target: true, secondary: true } } },
        distinct: ["exerciseId"],
      }),
      prisma.seance.count({ where: { userId } }),
      depotPreferences.lire(userId),
    ]);
    const parExercice = new Map(muscles.map((m) => [m.exercise.id, m.exercise]));
    const exerciseIds = [...new Set(lignes.flatMap((l) => l.exercices.map((e) => e.exerciseId)))];
    const histo = await historique(userId, exerciseIds);

    const seances = lignes.map((l): FaitSeance => {
      const detail = versDetail(l, anterieurA(histo, l.debut));
      const seriesParZone: Partial<Record<Zone, number>> = {};
      const principaux = new Set<string>();
      const secondaires = new Set<string>();
      for (const e of l.exercices) {
        const m = parExercice.get(e.exerciseId);
        // Une série compte pour la zone du muscle principal ; l'échauffement ne compte pas (D5).
        // Un exercice resté sans série n'a rien travaillé : il ne colore pas la silhouette.
        const n = e.series.filter((s) => s.faite && s.type !== "ECHAUFFEMENT").length;
        if (!m || n === 0) continue;
        principaux.add(m.target);
        for (const s of m.secondary) secondaires.add(s);
        const zone = zoneDuMuscle(m.target);
        if (zone) seriesParZone[zone] = (seriesParZone[zone] ?? 0) + n;
      }
      return {
        id: detail.id,
        nom: detail.nom,
        debut: detail.debut,
        fin: detail.fin,
        seriesFaites: detail.seriesFaites,
        volumeKg: detail.volumeKg,
        seriesParZone,
        muscles: {
          principaux: [...principaux],
          secondaires: [...secondaires].filter((m) => !principaux.has(m)),
        },
        records: detail.exercices.flatMap((e) =>
          e.series
            .filter((s) => s.records.length > 0)
            .map((s) => ({
              slug: e.slug,
              nom: e.nom,
              types: s.records,
              reps: s.reps,
              chargeKg: s.chargeKg,
            })),
        ),
      };
    });
    return { seances, total, objectifHebdo: preferences.objectifHebdo };
  },
};
