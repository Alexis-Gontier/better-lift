import { type HistoriqueExercice, type RecordExercice, recordsDe } from "@better-lift/shared";

/**
 * Les calculs de la fiche d'un exercice, sur l'historique que rend l'API. Les records viennent
 * de `shared` (`recordsDe`) : mêmes règles que partout — séries faites, hors échauffement, une
 * répétition au moins, 1RM au-delà de 12 répétitions ignoré (D307).
 */

type Seance = HistoriqueExercice[number];
type Serie = Seance["series"][number];

const compte = (s: Serie): s is Serie & { reps: number } =>
  s.faite && s.type !== "ECHAUFFEMENT" && s.reps !== null && s.reps > 0;

/** L'API rend la plus récente d'abord ; les records se jugent dans l'ordre du temps. */
export const chronologique = (h: HistoriqueExercice) =>
  [...h].sort((a, b) => a.debut.localeCompare(b.debut));

const datees = (seances: readonly Seance[]) =>
  seances.flatMap((x) => x.series.map((serie) => ({ ...serie, date: x.debut })));

/** Les records de l'exercice, chacun daté de la séance qui l'a établi. */
export function recordsExercice(h: HistoriqueExercice): RecordExercice[] {
  return recordsDe(datees(chronologique(h)));
}

/** Le volume d'une séance et ses meilleures charge et 1RM ; `null` sans série chargée qui compte. */
export function chiffresSeance(seance: Seance): {
  volume: number;
  charge: number | null;
  unRm: number | null;
} {
  const volume = seance.series.filter(compte).reduce((n, s) => n + (s.chargeKg ?? 0) * s.reps, 0);
  const records = recordsDe(datees([seance]));
  const valeur = (type: RecordExercice["type"]) =>
    records.find((r) => r.type === type)?.valeur ?? null;
  return {
    volume: Math.round(volume * 100) / 100,
    charge: valeur("CHARGE"),
    unRm: valeur("UN_RM"),
  };
}

/** La plus lourde charge faite pour chaque nombre de répétitions. */
export function meilleureChargeParReps(h: HistoriqueExercice): Map<number, number> {
  const meilleures = new Map<number, number>();
  for (const seance of h)
    for (const s of seance.series)
      if (compte(s) && s.chargeKg !== null)
        meilleures.set(s.reps, Math.max(meilleures.get(s.reps) ?? 0, s.chargeKg));
  return meilleures;
}

/** Charges de 100 % à 50 % du 1RM, par paliers de 5, arrondies aux 2,5 kg (disques de 1,25 kg). */
export function pourcentagesUnRm(unRm: number): { percent: number; kg: number }[] {
  return Array.from({ length: 11 }, (_, i) => {
    const percent = 100 - i * 5;
    return { percent, kg: Math.round((unRm * percent) / 100 / 2.5) * 2.5 };
  });
}
