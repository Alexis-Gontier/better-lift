import { z } from "zod";
import { type RoutineDetail, TYPES_SERIE, type TypeSerie } from "./routines.js";
import {
  defaireGroupe,
  deplacerAvecGroupes,
  groupeDe,
  lierAuSuivant,
  normaliserGroupes,
  retirerDuGroupe,
} from "./supersets.js";

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
  /** Le groupe de superset (D145). Absent d'un brouillon antérieur : lu comme `null`. */
  supersetGroupe?: number | null;
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
  /**
   * `signale` : la fin a déjà vibré — une seule fois par repos. `duree` (en
   * secondes) dessine la barre qui se vide (D335) ; absente d'un brouillon antérieur.
   */
  repos: { fin: string; signale: boolean; duree?: number } | null;
  /** La note de la séance, écrite à la fin (D130). Absente d'un brouillon antérieur. */
  note?: string;
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
    exercices: normaliserGroupes(
      r.exercices.map((e) => ({
        slug: e.slug,
        nom: e.nom,
        reposSec: e.reposSec,
        supersetGroupe: e.supersetGroupe ?? null,
        series: e.series.map((s) => ({
          type: s.type,
          reps: s.repsCible,
          chargeKg: s.chargeCibleKg,
          faite: false,
        })),
      })),
    ),
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
  /** Le repos par défaut du compte (D128), pour l'exercice qui n'a pas le sien. */
  reposDefautSec: number | null = null,
): SeanceEnCours {
  const e = s.exercices[iE];
  const etaitFaite = e?.series[iS]?.faite ?? false;
  if (etaitFaite) return avecSerie(s, iE, iS, (x) => ({ ...x, faite: false }));
  // D339 : cocher sans rien taper valide ce que montrent les cases, gris compris.
  // Les deux champs deviennent saisis : décochée, la série garde ses chiffres.
  const valeur = (c: Champ) => (e ? valeurAffichee(e, iS, c).valeur : null);
  const apres = avecSerie(s, iE, iS, (x) => ({
    ...x,
    chargeKg: valeur("chargeKg"),
    reps: valeur("reps"),
    faite: true,
    saisi: { chargeKg: true, reps: true },
  }));

  // D149 : dans un superset, le repos attend la fin du tour — toutes les séries
  // de ce rang cochées, dans n'importe quel ordre — et prend celui du dernier.
  const g = groupeDe(s.exercices, iE);
  if (g) {
    const membres = apres.exercices.slice(g.debut, g.fin + 1);
    if (!membres.every((e) => e.series[iS]?.faite ?? true)) return apres;
  }
  const reposSec = s.exercices[g ? g.fin : iE]?.reposSec ?? reposDefautSec;
  if (!reposSec) return apres;
  return {
    ...apres,
    repos: {
      fin: new Date(maintenant.getTime() + reposSec * 1000).toISOString(),
      signale: false,
      duree: reposSec,
    },
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

type Champ = "chargeKg" | "reps";

/**
 * Ce que montre une case d'une série (D339), comme Hevy : sa saisie, ou la série
 * faite, à l'encre ; sinon, en gris, ce qui a été fait la dernière fois à cette
 * position, puis la cible de la routine, puis la série du dessus de même type —
 * un poids tapé sur la série 1 d'un exercice neuf s'indique sur les suivantes.
 */
export function valeurAffichee(
  e: ExerciceEnCours,
  iS: number,
  champ: Champ,
): { valeur: number | null; saisie: boolean } {
  const x = e.series[iS];
  if (!x) return { valeur: null, saisie: false };
  if (x.faite || x.saisi?.[champ]) return { valeur: x[champ], saisie: true };
  const p = e.precedent?.[iS];
  if (p?.faite && p[champ] !== null) return { valeur: p[champ], saisie: false };
  if (x[champ] !== null) return { valeur: x[champ], saisie: false };
  for (let i = iS - 1; i >= 0; i--)
    if (e.series[i]?.type === x.type)
      return { valeur: valeurAffichee(e, i, champ).valeur, saisie: false };
  return { valeur: null, saisie: false };
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
    exercices: [
      ...s.exercices,
      { slug, nom, reposSec: null, supersetGroupe: null, series: [vide(), vide(), vide()] },
    ],
  };
}

export function retirerExercice(s: SeanceEnCours, iE: number): SeanceEnCours {
  return { ...s, exercices: normaliserGroupes(s.exercices.filter((_, i) => i !== iE)) };
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
  // D148 : l'exercice déplacé quitte son groupe, ou rejoint celui où il tombe.
  return { ...s, exercices: deplacerAvecGroupes(s.exercices, de, vers) };
}

/** D147 : superset avec l'exercice suivant. */
export function lierExercices(s: SeanceEnCours, iE: number): SeanceEnCours {
  return { ...s, exercices: lierAuSuivant(s.exercices, iE) };
}

/** D147 : retire l'exercice de son superset ; du milieu, il passe après le groupe. */
export function delierExercice(s: SeanceEnCours, iE: number): SeanceEnCours {
  return { ...s, exercices: retirerDuGroupe(s.exercices, iE) };
}

export function defaireSuperset(s: SeanceEnCours, iE: number): SeanceEnCours {
  return { ...s, exercices: defaireGroupe(s.exercices, iE) };
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
    supersetGroupe: e.supersetGroupe ?? null,
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
      // La durée suit : +15 s allonge la barre au lieu de la faire sauter en arrière.
      ...(s.repos.duree === undefined ? {} : { duree: Math.max(1, s.repos.duree + deltaSec) }),
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
 * La part du repos qui reste, de 1 (il commence) à 0 (il est fini) : la barre du
 * bandeau (D335). `null` sans repos, ou pour un brouillon qui n'a pas sa durée.
 */
export function partReposRestante(s: SeanceEnCours, maintenant: Date): number | null {
  if (!s.repos?.duree) return null;
  const restantMs = Date.parse(s.repos.fin) - maintenant.getTime();
  return Math.min(1, Math.max(0, restantMs / (s.repos.duree * 1000)));
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
 * L'ordre de passage des séries : exercice puis série, sauf dans un superset,
 * qui se parcourt tour par tour (D150) — A1, B1, A2, B2 — en sautant
 * l'exercice qui n'a plus de série à ce rang.
 */
function ordreDePassage(s: SeanceEnCours): { iE: number; iS: number; faite: boolean }[] {
  const ordre: { iE: number; iS: number; faite: boolean }[] = [];
  let iE = 0;
  while (iE < s.exercices.length) {
    const fin = groupeDe(s.exercices, iE)?.fin ?? iE;
    const membres = s.exercices.slice(iE, fin + 1);
    const tours = Math.max(0, ...membres.map((e) => e.series.length));
    for (let iS = 0; iS < tours; iS++)
      membres.forEach((e, k) => {
        const x = e.series[iS];
        if (x) ordre.push({ iE: iE + k, iS, faite: x.faite });
      });
    iE = fin + 1;
  }
  return ordre;
}

/**
 * La prochaine série à faire (D105) : la première pas encore faite, dans
 * l'ordre de passage (D150). C'est la seule ✓ de l'écran en aplat
 * lime ; une série sautée reste la prochaine tant qu'elle n'est pas faite.
 */
export function prochaineSerie(s: SeanceEnCours): { iE: number; iS: number } | null {
  const ordre = ordreDePassage(s);
  let derniere = -1;
  ordre.forEach((p, i) => {
    if (p.faite) derniere = i;
  });
  // D116 : la suite de la DERNIÈRE série faite — une série sautée ne retient pas
  // le repère en arrière (la fin de séance la signale). Rien après : la première
  // qui reste.
  const p = ordre.slice(derniere + 1).find((x) => !x.faite) ?? ordre.find((x) => !x.faite);
  return p ? { iE: p.iE, iS: p.iS } : null;
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
  // Facultatif (D145) : une séance en file d'avant les supersets ne l'a pas (D57).
  supersetGroupe: z.number().int().min(1).max(100).nullable().optional(),
  series: z.array(serieEnvoyee).max(50),
});

export const seanceSaisie = z
  .looseObject({
    id: z.string().min(1).max(100),
    routineId: z.string().min(1).nullable(),
    nom: z.string().trim().min(1).max(120),
    debut: z.iso.datetime(),
    fin: z.iso.datetime(),
    /** La note de la séance, écrite à la fin (D130). Absente des anciennes versions du mobile. */
    note: z.string().trim().max(1000).nullable().optional(),
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
    // Une note vide n'est pas une note : elle ne part pas.
    ...(s.note?.trim() ? { note: s.note.trim() } : {}),
    exercices: normaliserGroupes(s.exercices).map((e) => ({
      slug: e.slug,
      reposSec: e.reposSec,
      note: e.note ?? null,
      supersetGroupe: e.supersetGroupe ?? null,
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
