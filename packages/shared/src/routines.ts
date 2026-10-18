import { z } from "zod";
import { formaterCharge } from "./charge.js";
import type { UnitSystem } from "./units.js";

/**
 * Les routines : des gabarits de séance, décrits série par série (D47).
 *
 * Ces types sont ceux que l'API rendra : les données factices du dessin ont
 * déjà leur forme, pour que le branchement ne change que la source.
 */

export const TYPES_SERIE = ["ECHAUFFEMENT", "NORMALE", "ECHEC", "DEGRESSIVE"] as const;

export type TypeSerie = (typeof TYPES_SERIE)[number];

export const LIBELLE_TYPE_SERIE: Record<TypeSerie, string> = {
  ECHAUFFEMENT: "Échauffement",
  NORMALE: "Normale",
  ECHEC: "Échec",
  DEGRESSIVE: "Dégressive",
};

/** Pour le tableau des séries, où la place manque. */
export const ABREGE_TYPE_SERIE: Record<TypeSerie, string> = {
  ECHAUFFEMENT: "É",
  NORMALE: "N",
  ECHEC: "Éc",
  DEGRESSIVE: "D",
};

export type SerieRoutine = {
  type: TypeSerie;
  repsCible: number | null;
  /** Toujours en kilos ; l'affichage passe par `formaterCharge` (D52). */
  chargeCibleKg: number | null;
};

type ExerciceRoutine = {
  slug: string;
  /** Le nom français du catalogue. */
  nom: string;
  /** L'image fixe du catalogue (`imageDe`), ou `null`. */
  image: string | null;
  /** Les muscles du catalogue, en français : la carte des muscles en dérive (D83). */
  musclePrincipal: string;
  musclesSecondaires: string[];
  reposSec: number | null;
  /**
   * Le groupe de superset (D145), `null` hors groupe. Facultatif : une routine
   * gardée hors ligne par une version antérieure du mobile ne l'a pas.
   */
  supersetGroupe?: number | null;
  series: SerieRoutine[];
};

export type RoutineDetail = { id: string; nom: string; exercices: ExerciceRoutine[] };

export type RoutineResume = { id: string; nom: string; nbExercices: number; nbSeries: number };

// --- Le contrat d'écriture ---------------------------------------------------
// Ce que l'éditeur envoie. L'ordre des tableaux EST la position : le client
// n'envoie aucune position, le serveur la déduit de l'index (D50).

const serieSaisie = z.object({
  type: z.enum(TYPES_SERIE),
  repsCible: z.number().int().min(0).max(999).nullable(),
  chargeCibleKg: z.number().min(0).max(1000).nullable(),
});

const exerciceSaisi = z.object({
  slug: z.string().min(1).max(200),
  reposSec: z.number().int().min(0).max(3600).nullable(),
  // Facultatif (D145) : un éditeur d'avant les supersets ne l'envoie pas.
  supersetGroupe: z.number().int().min(1).max(100).nullable().optional(),
  series: z.array(serieSaisie).min(1).max(20),
});

export const routineSaisie = z.object({
  nom: z.string().trim().min(1).max(120),
  exercices: z.array(exerciceSaisi).min(1).max(50),
});

export type RoutineSaisie = z.infer<typeof routineSaisie>;

export const ordreRoutines = z.object({
  ids: z
    .array(z.string().min(1))
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, "Un identifiant apparaît deux fois."),
});

// --- L'affichage des séries ---------------------------------------------------

/**
 * Les étiquettes d'une liste de séries, à la Hevy : « É » pour l'échauffement,
 * puis 1, 2, 3… pour les autres — l'échauffement ne compte pas dans le numéro.
 */
export function etiquettesSeries(types: readonly TypeSerie[]): string[] {
  let n = 0;
  return types.map((t) => (t === "ECHAUFFEMENT" ? ABREGE_TYPE_SERIE.ECHAUFFEMENT : String(++n)));
}

/**
 * La série qui résume une séance passée : la plus lourde des séries faites, la
 * plus longue à charge égale (au poids du corps, la plus longue tout court).
 */
export function meilleureSerie(
  series: readonly { reps: number | null; chargeKg: number | null; faite: boolean }[],
): { reps: number | null; chargeKg: number | null } | null {
  let meilleure: { reps: number | null; chargeKg: number | null } | null = null;
  for (const s of series) {
    if (!s.faite) continue;
    const charge = s.chargeKg ?? -1;
    const reps = s.reps ?? -1;
    if (
      !meilleure ||
      charge > (meilleure.chargeKg ?? -1) ||
      (charge === (meilleure.chargeKg ?? -1) && reps > (meilleure.reps ?? -1))
    ) {
      meilleure = { reps: s.reps, chargeKg: s.chargeKg };
    }
  }
  return meilleure;
}

// --- Les résumés de la page d'une routine -------------------------------------

/** Le temps d'une série, effort compris : une estimation, pas une mesure. */
const SECONDES_PAR_SERIE = 40;

/**
 * La durée estimée d'une routine : chaque série, plus le repos qui la sépare de
 * la suivante. Un repos non fixé compte pour zéro — l'estimation reste basse
 * plutôt que d'inventer un chiffre.
 */
export function dureeEstimeeSec(
  exercices: readonly { reposSec: number | null; series: readonly unknown[] }[],
): number {
  return exercices.reduce((total, e) => {
    const n = e.series.length;
    return total + n * SECONDES_PAR_SERIE + Math.max(0, n - 1) * (e.reposSec ?? 0);
  }, 0);
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * « 3 × 8 · 60 kg » : ce qu'on lit d'un coup d'œil sur une carte d'exercice.
 * Les échauffements comptent à part ; la charge affichée est la plus lourde.
 */
export function resumeSeries(series: readonly SerieRoutine[], systeme: UnitSystem): string {
  const travail = series.filter((s) => s.type !== "ECHAUFFEMENT");
  const echauffements = series.length - travail.length;
  const parties: string[] = [];

  if (travail.length > 0) {
    const reps = new Set(travail.map((s) => s.repsCible));
    const [seules] = reps;
    parties.push(
      reps.size === 1 && seules != null
        ? `${travail.length} × ${seules}`
        : pluriel(travail.length, "série"),
    );
    const charges = travail.flatMap((s) => (s.chargeCibleKg === null ? [] : [s.chargeCibleKg]));
    if (charges.length > 0) parties.push(formaterCharge(Math.max(...charges), systeme));
  }
  if (echauffements > 0) parties.push(pluriel(echauffements, "échauffement"));

  return parties.join(" · ");
}
