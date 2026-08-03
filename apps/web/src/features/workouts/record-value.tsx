"use client";

import { type RecordType } from "@better-lift/validators";

import { Weight } from "@/features/account/units";
import { formatSetDuration } from "@/features/workouts/labels";

/**
 * Valeur d'un record, dans l'unité de son type.
 *
 * Seules les charges passent par `<Weight />`, qui lit la préférence kg/lb :
 * des répétitions, des secondes et des mètres ne se convertissent pas. C'est
 * aussi pourquoi la conversion n'est jamais faite à la main (doc 05).
 *
 * Partagé par le tableau de bord et la fiche d'un exercice : deux copies de ce
 * `switch` finiraient par ne plus convertir la même chose, et l'écart ne se
 * verrait que sur un profil impérial.
 */
export function RecordValue({ type, value }: { type: RecordType; value: string }) {
  switch (type) {
    case "BEST_1RM":
    case "BEST_WEIGHT":
    case "BEST_SET_VOLUME":
      return <Weight value={value} />;
    case "BEST_REPS":
      return <>{Math.round(Number(value))} reps</>;
    case "BEST_DURATION":
      return <>{formatSetDuration(Math.round(Number(value)))}</>;
    case "BEST_DISTANCE":
      return <>{Math.round(Number(value))} m</>;
  }
}
