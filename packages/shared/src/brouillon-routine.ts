import { chargeEnTexte, lireCharge } from "./charge.js";
import type { RoutineDetail, RoutineSaisie, TypeSerie } from "./routines.js";
import { normaliserGroupes } from "./supersets.js";
import type { UnitSystem } from "./units.js";

/**
 * La copie de travail de l'éditeur de routine, commune au web et au mobile (D85).
 *
 * Reps et charge y restent en TEXTE, tels que tapés : les convertir à la frappe
 * ferait disparaître « 82, » avant qu'on ait tapé le 5, et une saisie illisible
 * serait perdue au lieu d'être signalée. La conversion n'a lieu qu'à
 * l'enregistrement, par `versSaisie`.
 */
export type SerieBrouillon = { type: TypeSerie; reps: string; charge: string };

export type ExerciceBrouillon = {
  /** Clé locale stable : le slug ne suffit pas, un exercice peut figurer deux fois. */
  cle: string;
  slug: string;
  nom: string;
  image: string | null;
  repos: string;
  /** Le groupe de superset (D145), `null` hors groupe. */
  supersetGroupe: number | null;
  series: SerieBrouillon[];
};

export type Brouillon = {
  nom: string;
  /**
   * En texte, comme tapée ; blanche, elle vaut « pas de note ». ABSENTE quand le détail lu ne
   * la portait pas (cache d'une version antérieure) : on ne l'envoie pas, le serveur la garde.
   */
  note?: string;
  /** Repris tel quel, l'éditeur ne le change pas ; absent : inconnu, non envoyé (D298). */
  dossierId?: string | null;
  exercices: ExerciceBrouillon[];
};

// Pas de `crypto.randomUUID` : Hermes ne l'a pas. La clé n'a qu'à être unique
// dans l'écran ouvert — un compteur suffit, l'horodatage sépare deux ouvertures.
let compteur = 0;
const cle = () => `${Date.now().toString(36)}-${(compteur++).toString(36)}`;

export function versBrouillon(r: RoutineDetail | null, systeme: UnitSystem): Brouillon {
  if (!r) return { nom: "", note: "", dossierId: null, exercices: [] };
  return {
    nom: r.nom,
    ...(r.note !== undefined && { note: r.note ?? "" }),
    ...(r.dossierId !== undefined && { dossierId: r.dossierId }),
    exercices: r.exercices.map((e) => ({
      cle: cle(),
      slug: e.slug,
      nom: e.nom,
      image: e.image,
      repos: e.reposSec === null ? "" : String(e.reposSec),
      supersetGroupe: e.supersetGroupe ?? null,
      series: e.series.map((s) => ({
        type: s.type,
        reps: s.repsCible === null ? "" : String(s.repsCible),
        // Le nombre seul : l'unité est affichée à côté du champ.
        charge: s.chargeCibleKg === null ? "" : chargeEnTexte(s.chargeCibleKg, systeme),
      })),
    })),
  };
}

export function nouvelExercice(
  slug: string,
  nom: string,
  image: string | null = null,
): ExerciceBrouillon {
  const vide: SerieBrouillon = { type: "NORMALE", reps: "", charge: "" };
  return {
    cle: cle(),
    slug,
    nom,
    image,
    repos: "",
    supersetGroupe: null,
    series: [vide, { ...vide }, { ...vide }],
  };
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
export const chargeInvalide = (t: string, systeme: UnitSystem) =>
  Number.isNaN(lireCharge(t, systeme));

export function brouillonValide(b: Brouillon, systeme: UnitSystem): boolean {
  return (
    b.nom.trim() !== "" &&
    b.exercices.length > 0 &&
    b.exercices.every(
      (e) =>
        e.series.length > 0 &&
        !reposInvalide(e.repos) &&
        e.series.every((s) => !repsInvalides(s.reps) && !chargeInvalide(s.charge, systeme)),
    )
  );
}

/** Ce que l'API attend. À n'appeler que sur un brouillon valide. */
export function versSaisie(b: Brouillon, systeme: UnitSystem): RoutineSaisie {
  return {
    nom: b.nom.trim(),
    ...(b.note !== undefined && { note: b.note.trim() === "" ? null : b.note.trim() }),
    ...(b.dossierId !== undefined && { dossierId: b.dossierId }),
    exercices: normaliserGroupes(b.exercices).map((e) => ({
      slug: e.slug,
      reposSec: lireEntier(e.repos, 3600),
      supersetGroupe: e.supersetGroupe,
      series: e.series.map((s) => ({
        type: s.type,
        repsCible: lireEntier(s.reps, 999),
        chargeCibleKg: lireCharge(s.charge, systeme),
      })),
    })),
  };
}

/** Le brouillon sans ses clés locales : ce qu'on compare pour savoir s'il a changé. */
export const empreinte = (b: Brouillon) =>
  JSON.stringify({ ...b, exercices: b.exercices.map(({ cle: _cle, ...e }) => e) });
