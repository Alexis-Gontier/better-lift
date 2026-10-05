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
  /**
   * Les champs saisis pendant la séance, chacun pour soi : une case saisie ne
   * porte plus la cible de la routine. L'écran distingue ainsi ce qui est tapé
   * (encre) de ce qui est prévu (fantôme). Absent d'un brouillon antérieur : rien
   * de saisi. Jamais envoyé : il ne dit rien de l'entraînement.
   */
  saisi?: { chargeKg?: boolean; reps?: boolean };
};

export type ExerciceEnCours = {
  slug: string;
  nom: string;
  reposSec: number | null;
  /** La note libre de l'exercice (D90). Absente d'un brouillon antérieur : lue comme `null`. */
  note?: string | null;
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
  patch: Partial<Omit<SerieEnCours, "faite" | "saisi">>,
): SeanceEnCours {
  return avecSerie(s, iE, iS, (x) => {
    const saisi = {
      ...x.saisi,
      ...("chargeKg" in patch ? { chargeKg: true } : {}),
      ...("reps" in patch ? { reps: true } : {}),
    };
    return { ...x, ...patch, ...(Object.keys(saisi).length > 0 ? { saisi } : {}) };
  });
}

/** Une série de plus, qui recopie la dernière — non faite, ses valeurs en cibles. */
export function ajouterSerie(s: SeanceEnCours, iE: number): SeanceEnCours {
  return avecExercice(s, iE, (e) => {
    const derniere = e.series.at(-1);
    const nouvelle: SerieEnCours = derniere
      ? { ...derniere, faite: false, saisi: {} }
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

/** D90 : une note faite d'espaces n'est pas une note. */
export function modifierNote(s: SeanceEnCours, iE: number, note: string): SeanceEnCours {
  const propre = note.trim();
  return avecExercice(s, iE, (e) => ({ ...e, note: propre === "" ? null : note }));
}

/** D91 : le repos se règle par exercice ; `null` le désactive. */
export function modifierReposExercice(
  s: SeanceEnCours,
  iE: number,
  reposSec: number | null,
): SeanceEnCours {
  return avecExercice(s, iE, (e) => ({ ...e, reposSec }));
}

export function deplacerExercice(s: SeanceEnCours, de: number, vers: number): SeanceEnCours {
  const n = s.exercices.length;
  if (de < 0 || de >= n || vers < 0 || vers >= n || de === vers) return s;
  const exercices = [...s.exercices];
  const [bouge] = exercices.splice(de, 1);
  if (bouge) exercices.splice(vers, 0, bouge);
  return { ...s, exercices };
}

/**
 * Un autre exercice à la même place (D89) : la forme des séries et le repos
 * restent, les valeurs partent — elles ne valaient que pour l'ancien mouvement.
 * La note et « la dernière fois » aussi : elles décrivaient l'exercice remplacé.
 */
export function remplacerExercice(
  s: SeanceEnCours,
  iE: number,
  slug: string,
  nom: string,
): SeanceEnCours {
  return avecExercice(s, iE, (e) => ({
    slug,
    nom,
    reposSec: e.reposSec,
    note: null,
    series: e.series.map((x) => ({ type: x.type, reps: null, chargeKg: null, faite: false })),
  }));
}

export function arreterRepos(s: SeanceEnCours): SeanceEnCours {
  return { ...s, repos: null };
}

/**
 * −15 s / +15 s sur le repos en cours (D79). La fin ne recule jamais avant
 * `maintenant` : un repos raccourci au-delà s'achève, il ne devient pas négatif.
 * Rallonger rouvre la vibration de fin : le repos n'est plus fini.
 */
export function ajusterRepos(s: SeanceEnCours, deltaSec: number, maintenant: Date): SeanceEnCours {
  if (!s.repos) return s;
  const fin = Math.max(Date.parse(s.repos.fin) + deltaSec * 1000, maintenant.getTime());
  return {
    ...s,
    repos: {
      fin: new Date(fin).toISOString(),
      signale: fin > maintenant.getTime() ? false : s.repos.signale,
    },
  };
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
 * La prochaine série à faire (D105) : la première pas encore faite, dans
 * l'ordre des exercices puis des séries. C'est la seule ✓ de l'écran en aplat
 * lime ; une série sautée reste la prochaine tant qu'elle n'est pas faite.
 */
export function prochaineSerie(s: SeanceEnCours): { iE: number; iS: number } | null {
  for (let iE = 0; iE < s.exercices.length; iE++) {
    const iS = s.exercices[iE]?.series.findIndex((x) => !x.faite) ?? -1;
    if (iS !== -1) return { iE, iS };
  }
  return null;
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
  // Optionnelle : un mobile d'avant D90 ne l'envoie pas (D57).
  note: z.string().max(500).nullable().optional(),
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
      note: e.note ?? null,
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
