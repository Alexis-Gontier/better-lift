import {
  chargeEnTexte,
  type ExerciceRoutine,
  lireCharge,
  type RoutineDetail,
  type TypeSerie,
} from "@better-lift/shared";
import { SYSTEME_UNITES } from "@/lib/unites";

/**
 * La copie de travail de l'éditeur.
 *
 * Reps et charge y restent en TEXTE, tels que tapés : les convertir à la frappe
 * ferait disparaître « 82, » avant qu'on ait tapé le 5, et une saisie illisible
 * serait perdue au lieu d'être signalée. La conversion n'a lieu qu'à
 * l'enregistrement, par `versRoutine`.
 */
export type SerieBrouillon = { type: TypeSerie; reps: string; charge: string };

export type ExerciceBrouillon = {
  /** Clé locale stable : le slug ne suffit pas, un exercice peut figurer deux fois. */
  cle: string;
  slug: string;
  nom: string;
  repos: string;
  series: SerieBrouillon[];
};

export type Brouillon = { nom: string; exercices: ExerciceBrouillon[] };

const cle = () => crypto.randomUUID();

/** Le nombre affiché dans le champ charge ; l'unité est dans l'en-tête du tableau. */
const texteCharge = (kg: number | null) => (kg === null ? "" : chargeEnTexte(kg, SYSTEME_UNITES));

export function versBrouillon(r: RoutineDetail | null): Brouillon {
  if (!r) return { nom: "", exercices: [] };
  return {
    nom: r.nom,
    exercices: r.exercices.map((e) => ({
      cle: cle(),
      slug: e.slug,
      nom: e.nom,
      repos: e.reposSec === null ? "" : String(e.reposSec),
      series: e.series.map((s) => ({
        type: s.type,
        reps: s.repsCible === null ? "" : String(s.repsCible),
        charge: texteCharge(s.chargeCibleKg),
      })),
    })),
  };
}

export function nouvelExercice(slug: string, nom: string): ExerciceBrouillon {
  const vide: SerieBrouillon = { type: "NORMALE", reps: "", charge: "" };
  return { cle: cle(), slug, nom, repos: "", series: [vide, { ...vide }, { ...vide }] };
}

/** Un entier de 0 à `max`, ou vide. `NaN` signale une saisie à corriger. */
function lireEntier(texte: string, max: number): number | null {
  const propre = texte.trim();
  if (propre === "") return null;
  if (!/^\d+$/.test(propre)) return Number.NaN;
  const n = Number(propre);
  return n > max ? Number.NaN : n;
}

export const repsInvalides = (t: string) => Number.isNaN(lireEntier(t, 999));
export const reposInvalide = (t: string) => Number.isNaN(lireEntier(t, 3600));
export const chargeInvalide = (t: string) => Number.isNaN(lireCharge(t, SYSTEME_UNITES));

export function brouillonValide(b: Brouillon): boolean {
  return (
    b.nom.trim() !== "" &&
    b.exercices.length > 0 &&
    b.exercices.every(
      (e) =>
        e.series.length > 0 &&
        !reposInvalide(e.repos) &&
        e.series.every((s) => !repsInvalides(s.reps) && !chargeInvalide(s.charge)),
    )
  );
}

/** À n'appeler que sur un brouillon valide. */
export function versRoutine(b: Brouillon): { nom: string; exercices: ExerciceRoutine[] } {
  return {
    nom: b.nom.trim(),
    exercices: b.exercices.map((e) => ({
      slug: e.slug,
      nom: e.nom,
      reposSec: lireEntier(e.repos, 3600),
      series: e.series.map((s) => ({
        type: s.type,
        repsCible: lireEntier(s.reps, 999),
        chargeCibleKg: lireCharge(s.charge, SYSTEME_UNITES),
      })),
    })),
  };
}
