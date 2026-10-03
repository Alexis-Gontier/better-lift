import { marquerRecords, type RecordExercice, type TypeRecord } from "./records.js";
import type { SeanceEnCours } from "./seance.js";

/**
 * Les records que la séance bat, montrés à la fin (D111) — avant même l'envoi,
 * donc calculés sur le téléphone contre les records connus de chaque exercice.
 */

export type RecordBattu = {
  slug: string;
  nom: string;
  reps: number | null;
  chargeKg: number | null;
  types: TypeRecord[];
};

/**
 * `avant` : par slug, les records d'avant la séance. Un exercice présent deux
 * fois se juge d'un seul tenant, dans l'ordre, comme le détail côté API (D64).
 * Un exercice dont les records manquent (hors ligne, jamais lus) est écarté :
 * pas de record déclaré sans preuve — `incomplet` le dit.
 */
export function recordsBattus(
  s: SeanceEnCours,
  avant: Readonly<Record<string, RecordExercice[] | undefined>>,
): { battus: RecordBattu[]; incomplet: boolean } {
  const battus: RecordBattu[] = [];
  let incomplet = false;
  for (const slug of new Set(s.exercices.map((e) => e.slug))) {
    const records = avant[slug];
    if (!records) {
      incomplet = true;
      continue;
    }
    const occurrences = s.exercices.filter((e) => e.slug === slug);
    const series = occurrences.flatMap((e) => e.series);
    const marques = marquerRecords(records, series);
    series.forEach((serie, i) => {
      const types = marques[i] ?? [];
      if (types.length > 0) {
        battus.push({
          slug,
          nom: occurrences[0]?.nom ?? slug,
          reps: serie.reps,
          chargeKg: serie.chargeKg,
          types,
        });
      }
    });
  }
  return { battus, incomplet };
}
