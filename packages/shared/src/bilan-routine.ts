import type { TypeSerie } from "./routines.js";

/**
 * Le résumé d'une routine (D213), dérivé des séances faites avec elle : rien n'est stocké.
 * Le volume ne compte que les séries de travail FAITES, chargées, comme l'analyse d'un exercice.
 */
export type BilanRoutine = {
  seances: number;
  /** Le début de la séance la plus récente (ISO). */
  derniere: string;
  dureeMoyenneMin: number;
  volumeMoyenKg: number;
};

type SeanceBilan = {
  debut: string;
  fin: string;
  series: { type: TypeSerie; reps: number | null; chargeKg: number | null; faite: boolean }[];
};

/** `null` quand la routine n'a jamais été faite : l'écran le dit au lieu de tuiles vides. */
export function bilanRoutine(seances: SeanceBilan[]): BilanRoutine | null {
  if (seances.length === 0) return null;
  let duree = 0;
  let volume = 0;
  let derniere = seances[0]?.debut ?? "";
  for (const s of seances) {
    duree += Date.parse(s.fin) - Date.parse(s.debut);
    if (s.debut > derniere) derniere = s.debut;
    for (const x of s.series) {
      if (!x.faite || x.type === "ECHAUFFEMENT" || !x.reps || x.chargeKg === null) continue;
      volume += x.chargeKg * x.reps;
    }
  }
  return {
    seances: seances.length,
    derniere,
    dureeMoyenneMin: Math.round(duree / seances.length / 60_000),
    volumeMoyenKg: Math.round(volume / seances.length),
  };
}

/** Jusqu'où remonter pour juger la tendance : assez pour lisser une séance ratée. */
const RECUL = 4;

/**
 * La tendance d'une suite de valeurs, de la plus ancienne à la plus récente (D214) : la
 * dernière face à celle d'il y a jusqu'à quatre séances. `null` sous deux valeurs.
 */
export function tendance(valeurs: number[]): "hausse" | "stable" | "baisse" | null {
  if (valeurs.length < 2) return null;
  const derniere = valeurs.at(-1) as number;
  const avant = valeurs[Math.max(0, valeurs.length - 1 - RECUL)] as number;
  if (derniere > avant) return "hausse";
  return derniere < avant ? "baisse" : "stable";
}
