import type { FaitSeance, TableauDeBord } from "@better-lift/shared";

const JOUR = 86_400_000;
const NOMS = ["Push A", "Pull A", "Jambes"] as const;
const ZONES: Record<(typeof NOMS)[number], FaitSeance["seriesParZone"]> = {
  "Push A": { chest: 8, deltoids: 5, triceps: 4 },
  "Pull A": { "upper-back": 9, biceps: 5, trapezius: 2 },
  Jambes: { quadriceps: 8, hamstring: 5, gluteal: 4, calves: 3 },
};
const MUSCLES: Record<(typeof NOMS)[number], FaitSeance["muscles"]> = {
  "Push A": { principaux: ["Pectoraux", "Épaules", "Triceps"], secondaires: ["Avant-bras"] },
  "Pull A": { principaux: ["Grand dorsal", "Biceps", "Trapèzes"], secondaires: ["Avant-bras"] },
  Jambes: { principaux: ["Quadriceps", "Ischio-jambiers", "Fessiers", "Mollets"], secondaires: [] },
};

/** Données factices du dessin (tâche 2) ; retirées au branchement (tâche 4). */
export const FIXTURE: TableauDeBord = (() => {
  const maintenant = Date.now();
  const seances: FaitSeance[] = [];
  for (let i = 0; i < 78; i++) {
    const semaine = Math.floor(i / 3);
    if (semaine === 4 || semaine === 7 || semaine === 19) continue; // trois semaines creuses
    const nom = NOMS[i % 3] ?? "Push A";
    const debut = new Date(maintenant - (semaine * 7 + (i % 3) * 2 + 1) * JOUR).toISOString();
    const volumeKg = 6000 + ((i * 1337) % 5000);
    const seriesFaites = Object.values(ZONES[nom]).reduce((a, b) => a + (b ?? 0), 0);
    seances.push({
      id: `s-${i}`,
      nom,
      debut,
      fin: new Date(Date.parse(debut) + (55 + (i % 4) * 5) * 60_000).toISOString(),
      seriesFaites,
      volumeKg,
      seriesParZone: ZONES[nom],
      muscles: MUSCLES[nom],
      records:
        i % 9 === 0
          ? [
              {
                slug: "barbell-bench-press",
                nom: "Développé couché à la barre",
                types: ["CHARGE"],
                reps: 5,
                chargeKg: 120 - Math.floor(i / 9) * 2.5,
              },
            ]
          : [],
    });
  }
  return {
    seances,
    total: seances.length,
    objectifHebdo: 3,
  };
})();
