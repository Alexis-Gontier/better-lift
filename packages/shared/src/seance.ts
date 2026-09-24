import { z } from "zod";
import { type RoutineDetail, TYPES_SERIE, type TypeSerie } from "./routines.js";

/**
 * La séance en cours — la logique, sans plateforme (D61).
 *
 * Tout ici est PUR et IMMUABLE : chaque fonction rend une nouvelle séance. Le
 * mobile réécrit le brouillon sur disque à chaque changement ; une mutation en
 * place ne laisserait voir aucune différence, ni à React, ni à l'écriture.
 *
 * Le temps n'est jamais compté : il se DÉDUIT d'heures stockées (`debut`,
 * `repos.fin`). C'est ce qui garde le chrono juste après une mise en veille ou
 * un arrêt forcé — un compteur, lui, repartirait de zéro.
 */

export type SerieEnCours = {
  type: TypeSerie;
  reps: number | null;
  chargeKg: number | null;
  faite: boolean;
};

export type ExerciceEnCours = {
  slug: string;
  nom: string;
  reposSec: number | null;
  series: SerieEnCours[];
  /**
   * Ce qui a été fait la dernière fois sur cet exercice (D67) — une INDICATION
   * affichée sous chaque série, jamais une valeur des cases (D59). Copiée dans
   * le brouillon : elle survit hors ligne et à un arrêt forcé.
   */
  precedent?: { reps: number | null; chargeKg: number | null; faite: boolean }[];
};

export type SeanceEnCours = {
  /** Généré par le client : c'est lui qui rend l'envoi rejouable (D56). */
  id: string;
  routineId: string | null;
  nom: string;
  /** ISO 8601 : une chaîne, pour traverser le disque sans perte. */
  debut: string;
  exercices: ExerciceEnCours[];
  /** `signale` : la fin a déjà vibré — une seule fois par repos. */
  repos: { fin: string; signale: boolean } | null;
};

export function demarrerDepuisRoutine(
  r: RoutineDetail,
  id: string,
  maintenant: Date,
): SeanceEnCours {
  return {
    id,
    routineId: r.id,
    nom: r.nom,
    debut: maintenant.toISOString(),
    // D59 : les cibles de la routine pré-remplissent les séries.
    exercices: r.exercices.map((e) => ({
      slug: e.slug,
      nom: e.nom,
      reposSec: e.reposSec,
      series: e.series.map((s) => ({
        type: s.type,
        reps: s.repsCible,
        chargeKg: s.chargeCibleKg,
        faite: false,
      })),
    })),
    repos: null,
  };
}

export function demarrerVide(id: string, maintenant: Date): SeanceEnCours {
  return {
    id,
    routineId: null,
    nom: "Séance libre",
    debut: maintenant.toISOString(),
    exercices: [],
    repos: null,
  };
}

/** Remplace l'exercice `iE` par ce que rend `f`. */
function avecExercice(
  s: SeanceEnCours,
  iE: number,
  f: (e: ExerciceEnCours) => ExerciceEnCours,
): SeanceEnCours {
  return { ...s, exercices: s.exercices.map((e, i) => (i === iE ? f(e) : e)) };
}

function avecSerie(
  s: SeanceEnCours,
  iE: number,
  iS: number,
  f: (x: SerieEnCours) => SerieEnCours,
): SeanceEnCours {
  return avecExercice(s, iE, (e) => ({
    ...e,
    series: e.series.map((x, i) => (i === iS ? f(x) : x)),
  }));
}

/**
 * Coche une série — et lance le repos de l'exercice, s'il en a un. Décocher une
 * série faite (une erreur de doigt) ne touche pas au repos en cours.
 */
export function validerSerie(
  s: SeanceEnCours,
  iE: number,
  iS: number,
  maintenant: Date,
): SeanceEnCours {
  const etaitFaite = s.exercices[iE]?.series[iS]?.faite ?? false;
  const apres = avecSerie(s, iE, iS, (x) => ({ ...x, faite: !x.faite }));
  if (etaitFaite) return apres;

  const reposSec = s.exercices[iE]?.reposSec;
  if (!reposSec) return apres;
  return {
    ...apres,
    repos: { fin: new Date(maintenant.getTime() + reposSec * 1000).toISOString(), signale: false },
  };
}

export function modifierSerie(
  s: SeanceEnCours,
  iE: number,
  iS: number,
  patch: Partial<Omit<SerieEnCours, "faite">>,
): SeanceEnCours {
  return avecSerie(s, iE, iS, (x) => ({ ...x, ...patch }));
}

/** Une série de plus, qui recopie la dernière — non faite. */
export function ajouterSerie(s: SeanceEnCours, iE: number): SeanceEnCours {
  return avecExercice(s, iE, (e) => {
    const derniere = e.series.at(-1);
    const nouvelle: SerieEnCours = derniere
      ? { ...derniere, faite: false }
      : { type: "NORMALE", reps: null, chargeKg: null, faite: false };
    return { ...e, series: [...e.series, nouvelle] };
  });
}

export function retirerSerie(s: SeanceEnCours, iE: number, iS: number): SeanceEnCours {
  return avecExercice(s, iE, (e) => ({ ...e, series: e.series.filter((_, i) => i !== iS) }));
}

export function ajouterExercice(s: SeanceEnCours, slug: string, nom: string): SeanceEnCours {
  const vide = (): SerieEnCours => ({ type: "NORMALE", reps: null, chargeKg: null, faite: false });
  return {
    ...s,
    exercices: [...s.exercices, { slug, nom, reposSec: null, series: [vide(), vide(), vide()] }],
  };
}

export function retirerExercice(s: SeanceEnCours, iE: number): SeanceEnCours {
  return { ...s, exercices: s.exercices.filter((_, i) => i !== iE) };
}

export function arreterRepos(s: SeanceEnCours): SeanceEnCours {
  return { ...s, repos: null };
}

export function marquerReposSignale(s: SeanceEnCours): SeanceEnCours {
  return s.repos ? { ...s, repos: { ...s.repos, signale: true } } : s;
}

/** Le chrono de la séance, en secondes. */
export function secondesEcoulees(debutIso: string, maintenant: Date): number {
  return Math.max(0, Math.floor((maintenant.getTime() - Date.parse(debutIso)) / 1000));
}

/**
 * Les secondes de repos restantes ; 0 pendant la seconde où il s'achève (le
 * bandeau affiche « c'est reparti ») ; `null` quand il n'y a plus de repos.
 */
export function reposRestant(s: SeanceEnCours, maintenant: Date): number | null {
  if (!s.repos) return null;
  const restant = Math.ceil((Date.parse(s.repos.fin) - maintenant.getTime()) / 1000);
  if (restant < -3) return null;
  return Math.max(0, restant);
}

/**
 * Le bilan d'une séance : séries faites et volume. Dérivé, jamais stocké (D58).
 * D5 : l'échauffement et les séries sans charge (poids du corps) ne comptent
 * pas dans le volume.
 */
export function bilanSeance(s: SeanceEnCours): { seriesFaites: number; volumeKg: number } {
  let seriesFaites = 0;
  let volumeKg = 0;
  for (const e of s.exercices) {
    for (const x of e.series) {
      if (!x.faite) continue;
      seriesFaites++;
      if (x.type !== "ECHAUFFEMENT" && x.reps !== null && x.chargeKg !== null)
        volumeKg += x.reps * x.chargeKg;
    }
  }
  return { seriesFaites, volumeKg: Math.round(volumeKg * 100) / 100 };
}

// --- L'envoi -----------------------------------------------------------------
// Ce que le mobile poste une fois la séance terminée. NON STRICT à tous les
// niveaux (D57) : un champ inconnu est ignoré plutôt que de faire refuser — et
// donc perdre — un entraînement réel. Une version plus récente du mobile peut
// ajouter des champs sans que l'API en place ne les rejette.

const serieEnvoyee = z.looseObject({
  type: z.enum(TYPES_SERIE),
  reps: z.number().int().min(0).max(999).nullable(),
  chargeKg: z.number().min(0).max(1000).nullable(),
  faite: z.boolean(),
});

const exerciceEnvoye = z.looseObject({
  slug: z.string().min(1).max(200),
  reposSec: z.number().int().min(0).max(3600).nullable(),
  series: z.array(serieEnvoyee).max(50),
});

export const seanceSaisie = z
  .looseObject({
    id: z.string().min(1).max(100),
    routineId: z.string().min(1).nullable(),
    nom: z.string().trim().min(1).max(120),
    debut: z.iso.datetime(),
    fin: z.iso.datetime(),
    exercices: z.array(exerciceEnvoye).max(100),
  })
  .refine((s) => Date.parse(s.fin) >= Date.parse(s.debut), "La fin précède le début.");

export type SeanceSaisie = z.infer<typeof seanceSaisie>;

/** La séance terminée, prête à poster. `fin` est l'heure où l'on a terminé. */
export function versEnvoi(s: SeanceEnCours, fin: Date): SeanceSaisie {
  return {
    id: s.id,
    routineId: s.routineId,
    nom: s.nom,
    debut: s.debut,
    fin: fin.toISOString(),
    exercices: s.exercices.map((e) => ({
      slug: e.slug,
      reposSec: e.reposSec,
      series: e.series.map(({ type, reps, chargeKg, faite }) => ({ type, reps, chargeKg, faite })),
    })),
  };
}

/** Attache à chaque exercice ce qui a été fait la dernière fois, s'il y a une dernière fois. */
export function avecPrecedents(
  s: SeanceEnCours,
  parSlug: Record<string, { reps: number | null; chargeKg: number | null; faite: boolean }[]>,
): SeanceEnCours {
  return {
    ...s,
    exercices: s.exercices.map((e) => {
      const precedent = parSlug[e.slug];
      return precedent && precedent.length > 0 ? { ...e, precedent } : e;
    }),
  };
}
