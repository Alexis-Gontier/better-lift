import type { ApercuExercice } from "./apercu.js";
import type { TypeSerie } from "./routines.js";
import { estimate1RM } from "./training.js";

/**
 * Les records, à la manière de Hevy (D63) — dérivés à la lecture, jamais
 * stockés (D13, D65) : corriger une séance ne demande aucun recalcul.
 *
 * Avec charge : charge max (départagée aux reps), 1RM estimé (Epley, D4) et
 * meilleure série en volume. Au poids du corps : le maximum de reps.
 * Ne comptent que les séries FAITES, hors échauffement, d'au moins une rep.
 */

export type SerieHisto = {
  type: TypeSerie;
  reps: number | null;
  chargeKg: number | null;
  faite: boolean;
};

const TYPES_RECORD = ["CHARGE", "UN_RM", "VOLUME", "REPS"] as const;
export type TypeRecord = (typeof TYPES_RECORD)[number];

export const LIBELLE_RECORD: Record<TypeRecord, string> = {
  CHARGE: "Charge",
  UN_RM: "1RM estimé",
  VOLUME: "Volume",
  REPS: "Reps",
};

export type RecordExercice = {
  type: TypeRecord;
  valeur: number;
  reps: number;
  chargeKg: number | null;
  date: string;
};

type Candidat = Omit<RecordExercice, "date">;

/**
 * Au-delà, Epley n'a plus de sens : 56 × 82,5 kg donnerait un 1RM de 236,5 kg.
 * Une telle série compte pour la charge et le volume, pas pour le 1RM.
 */
const REPS_MAX_1RM = 12;

function compte(s: SerieHisto): s is SerieHisto & { reps: number } {
  return s.faite && s.type !== "ECHAUFFEMENT" && s.reps !== null && s.reps > 0;
}

/** Ce qu'une série pourrait établir comme records. */
function candidats(s: SerieHisto & { reps: number }): Candidat[] {
  if (s.chargeKg === null) return [{ type: "REPS", valeur: s.reps, reps: s.reps, chargeKg: null }];
  const base = { reps: s.reps, chargeKg: s.chargeKg };
  return [
    { type: "CHARGE", valeur: s.chargeKg, ...base },
    ...(s.reps <= REPS_MAX_1RM
      ? [{ type: "UN_RM" as const, valeur: estimate1RM(s.chargeKg, s.reps), ...base }]
      : []),
    { type: "VOLUME", valeur: Math.round(s.chargeKg * s.reps * 100) / 100, ...base },
  ];
}

/** Strictement meilleur : une égalité ne bat rien. À charge égale, plus de reps l'emporte. */
function bat(c: Candidat, actuel: Candidat | undefined): boolean {
  if (!actuel) return true;
  if (c.valeur !== actuel.valeur) return c.valeur > actuel.valeur;
  return c.type === "CHARGE" && c.reps > actuel.reps;
}

const ordonner = (m: Map<TypeRecord, RecordExercice>) =>
  TYPES_RECORD.flatMap((t) => {
    const r = m.get(t);
    return r ? [r] : [];
  });

/** Les records d'un historique, parcouru dans l'ordre CHRONOLOGIQUE. */
export function recordsDe(series: (SerieHisto & { date: string })[]): RecordExercice[] {
  const meilleurs = new Map<TypeRecord, RecordExercice>();
  for (const s of series) {
    if (!compte(s)) continue;
    for (const c of candidats(s)) {
      if (bat(c, meilleurs.get(c.type))) meilleurs.set(c.type, { ...c, date: s.date });
    }
  }
  return ordonner(meilleurs);
}

/**
 * Pour chaque série d'une séance, les records qu'elle a battus À CE MOMENT-LÀ
 * (D64) : contre l'historique antérieur, puis contre les séries précédentes de
 * la même séance.
 */
export function marquerRecords(avant: RecordExercice[], series: SerieHisto[]): TypeRecord[][] {
  const meilleurs = new Map<TypeRecord, Candidat>(avant.map((r) => [r.type, r]));
  return series.map((s) => {
    if (!compte(s)) return [];
    const battus: TypeRecord[] = [];
    for (const c of candidats(s)) {
      if (bat(c, meilleurs.get(c.type))) {
        meilleurs.set(c.type, c);
        battus.push(c.type);
      }
    }
    return battus;
  });
}

// --- Ce que rend la lecture des séances (lot 7) ------------------------------
// Partagé par l'API qui le produit et le web qui l'affiche.

export type SeanceResume = {
  id: string;
  nom: string;
  /** La routine d'origine, `null` pour une séance vide : l'Accueil en déduit « À suivre » (D110). */
  routineId: string | null;
  /** ISO 8601 ; le jour s'en déduit dans le fuseau de l'utilisateur, jamais en UTC. */
  debut: string;
  fin: string;
  seriesFaites: number;
  volumeKg: number;
  /** Les séries qui ont battu au moins un record, à ce moment-là (D64, D110). */
  nbRecords: number;
};

/** Une séance dans le fil de l'Accueil (D119) : son résumé et ses premiers exercices. */
export type SeanceFil = SeanceResume & { nbExercices: number; apercu: ApercuExercice[] };

type SerieLue = {
  type: TypeSerie;
  reps: number | null;
  chargeKg: number | null;
  faite: boolean;
  /** Les records que cette série a battus à ce moment-là (D64). */
  records: TypeRecord[];
};

export type SeanceDetail = SeanceResume & {
  /** La note de la séance (D130), `null` sans note. */
  note: string | null;
  /**
   * `note` : la note libre de l'exercice (D90), `null` sans note. `precedentes` :
   * TOUTES les séries de sa dernière occurrence antérieure, dans l'ordre — le
   * détail les compare position par position (D123).
   */
  exercices: {
    slug: string;
    nom: string;
    image: string | null;
    /** Les muscles de la fiche (D345) : la carte des muscles du détail, sur le mobile. */
    musclePrincipal: string;
    musclesSecondaires: string[];
    note: string | null;
    /** Le groupe de superset (D153), `null` hors groupe ; absent d'un cache antérieur. */
    supersetGroupe?: number | null;
    series: SerieLue[];
    precedentes: { reps: number | null; chargeKg: number | null }[];
  }[];
};

/** Les séances où figure un exercice, de la plus récente à la plus ancienne (D124). */
export type HistoriqueExercice = {
  id: string;
  nom: string;
  debut: string;
  series: { type: TypeSerie; reps: number | null; chargeKg: number | null; faite: boolean }[];
}[];
