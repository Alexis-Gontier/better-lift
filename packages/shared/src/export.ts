import type { TypeSerie } from "./routines.js";

/** Une série de l'export (D128) : une ligne du fichier. */
export type LigneExport = {
  /** ISO 8601, le début de la séance. */
  date: string;
  seance: string;
  exercice: string;
  /** La position de la série dans l'exercice, à partir de 1. */
  serie: number;
  type: TypeSerie;
  chargeKg: number | null;
  reps: number | null;
  faite: boolean;
};

const ENTETE = ["date", "seance", "exercice", "serie", "type", "charge_kg", "reps", "faite"];

/** Un champ CSV : entre guillemets dès qu'il contient un séparateur, un guillemet ou un saut. */
function champ(v: string | number | boolean | null): string {
  if (v === null) return "";
  const texte = String(v);
  return /[",\n\r]/.test(texte) ? `"${texte.replaceAll('"', '""')}"` : texte;
}

/**
 * Toutes les séries du compte en CSV (RFC 4180 : virgules, point décimal) :
 * lisible par n'importe quel tableur, et par une autre application.
 */
export function versCsv(lignes: readonly LigneExport[]): string {
  const corps = lignes.map((l) =>
    [l.date, l.seance, l.exercice, l.serie, l.type, l.chargeKg, l.reps, l.faite]
      .map(champ)
      .join(","),
  );
  return `${[ENTETE.join(","), ...corps].join("\r\n")}\r\n`;
}
