import { toNumber } from "./decimal.js";
import { estimate1RM } from "./one-rep-max.js";
import { type DecimalLike, type ExerciseType, type MeasuredSet, type RecordType } from "./types.js";
import { countsTowardTotals } from "./volume.js";

/**
 * Un record n'est battu qu'à valeur **strictement** supérieure (invariant 5) :
 * à égalité, le record existant garde sa date, sinon la moindre séance
 * répétant la même performance réécrirait l'historique.
 */
export function isPersonalRecord(
  candidate: DecimalLike,
  current: DecimalLike | null | undefined,
): boolean {
  const value = toNumber(candidate);

  if (value <= 0) {
    return false;
  }

  if (current === null || current === undefined) {
    return true;
  }

  return value > toNumber(current);
}

/** Valeur d'une série pour un type de record donné, ou `null` si non applicable. */
export function recordValue(
  set: MeasuredSet,
  exerciseType: ExerciseType,
  type: RecordType,
): number | null {
  if (!countsTowardTotals(set)) {
    return null;
  }

  const reps = set.reps ?? 0;
  const weightKg = set.weightKg === null || set.weightKg === undefined ? 0 : toNumber(set.weightKg);

  switch (type) {
    case "BEST_1RM":
      // L'assistance soustrait de la charge : un 1RM n'y a pas de sens.
      if (exerciseType === "ASSISTED_BODYWEIGHT") {
        return null;
      }
      return estimate1RM(weightKg, reps);

    case "BEST_WEIGHT":
      return weightKg > 0 ? weightKg : null;

    case "BEST_SET_VOLUME":
      return weightKg > 0 && reps > 0 ? weightKg * reps : null;

    case "BEST_REPS":
      return reps > 0 ? reps : null;

    case "BEST_DURATION":
      return set.durationSec && set.durationSec > 0 ? set.durationSec : null;

    case "BEST_DISTANCE": {
      const distance =
        set.distanceM === null || set.distanceM === undefined ? 0 : toNumber(set.distanceM);
      return distance > 0 ? distance : null;
    }
  }
}
