import { prisma } from "@better-lift/db";
import type { Bilan } from "@better-lift/shared";

/**
 * Les statistiques (D112), côté métier : le bilan de toujours, dérivé des séances à la lecture
 * (D58). Ce module ne connaît pas Hono.
 */

export type DepotStats = {
  /** Le bilan de toujours, pour l'en-tête du Profil (D128). */
  bilan(userId: string): Promise<Bilan>;
};

export const depotStats: DepotStats = {
  async bilan(userId) {
    const [agregat, series] = await Promise.all([
      prisma.seance.aggregate({ where: { userId }, _count: true, _min: { debut: true } }),
      // Le volume compte comme partout ailleurs : séries faites, hors échauffement (D5).
      prisma.seanceSerie.findMany({
        where: {
          faite: true,
          type: { not: "ECHAUFFEMENT" },
          exercice: { seance: { userId } },
        },
        select: { reps: true, chargeKg: true },
      }),
    ]);
    let volumeKg = 0;
    for (const s of series) {
      if (s.reps !== null && s.chargeKg !== null) volumeKg += s.reps * Number(s.chargeKg);
    }
    return {
      nbSeances: agregat._count,
      volumeKg: Math.round(volumeKg),
      depuis: agregat._min.debut?.toISOString() ?? null,
    };
  },
};
