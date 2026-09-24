import { prisma } from "@better-lift/db";
import {
  marquerRecords,
  type RecordExercice,
  recordsDe,
  type SeanceSaisie,
  type SerieHisto,
  type TypeRecord,
  type TypeSerie,
} from "@better-lift/shared";
import { SlugInconnu } from "./routines.js";

/**
 * Les séances, côté métier. Ce module ne connaît pas Hono.
 *
 * Une seule écriture, et elle doit être REJOUABLE (D56) : la file du mobile
 * renvoie une séance tant qu'elle n'a pas de réponse, y compris quand la
 * première tentative a abouti mais que la réponse s'est perdue en route.
 */

type SerieEcrite = {
  position: number;
  type: TypeSerie;
  reps: number | null;
  chargeKg: number | null;
  faite: boolean;
};
type ExerciceEcrit = {
  position: number;
  exerciseId: string;
  reposSec: number | null;
  series: SerieEcrite[];
};

/** La saisie, prête à écrire. L'ordre des tableaux devient la position. */
export function versEcriture(
  saisie: SeanceSaisie,
  idsParSlug: Map<string, string>,
): ExerciceEcrit[] {
  return saisie.exercices.map((e, position) => {
    const exerciseId = idsParSlug.get(e.slug);
    if (!exerciseId) throw new SlugInconnu(e.slug);
    return {
      position,
      exerciseId,
      reposSec: e.reposSec,
      // Seuls les champs connus sont retenus : la saisie est non stricte (D57),
      // elle peut en porter d'autres, qui n'ont rien à faire en base.
      series: e.series.map((s, i) => ({
        position: i,
        type: s.type,
        reps: s.reps,
        chargeKg: s.chargeKg,
        faite: s.faite,
      })),
    };
  });
}

type IssueEnregistrement = "creee" | "existante" | "conflit";

export type DepotSeances = {
  /**
   * `creee` : écrite. `existante` : cet identifiant est déjà à lui — un rejeu,
   * rien n'est réécrit. `conflit` : il appartient à un autre. Lève `SlugInconnu`.
   */
  enregistrer(userId: string, saisie: SeanceSaisie): Promise<IssueEnregistrement>;
};

async function proprietaire(id: string): Promise<string | null> {
  const s = await prisma.seance.findUnique({ where: { id }, select: { userId: true } });
  return s?.userId ?? null;
}

export const depotPrisma: DepotSeances = {
  async enregistrer(userId, saisie) {
    const deja = await proprietaire(saisie.id);
    if (deja) return deja === userId ? "existante" : "conflit";

    // Les archivés se résolvent AUSSI (D57) : un exercice archivé entre le
    // début de la séance et son envoi ne doit pas faire perdre la séance.
    const slugs = [...new Set(saisie.exercices.map((e) => e.slug))];
    const lignes = await prisma.exercise.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true },
    });
    const exercices = versEcriture(saisie, new Map(lignes.map((l) => [l.slug, l.id])));

    // Une routine supprimée — ou qui n'est pas à lui — n'empêche pas d'enregistrer :
    // la séance est un instantané, elle perd seulement son lien.
    const routine = saisie.routineId
      ? await prisma.routine.findFirst({
          where: { id: saisie.routineId, userId },
          select: { id: true },
        })
      : null;

    try {
      await prisma.seance.create({
        data: {
          id: saisie.id,
          userId,
          routineId: routine?.id ?? null,
          nom: saisie.nom,
          debut: new Date(saisie.debut),
          fin: new Date(saisie.fin),
          exercices: {
            create: exercices.map((e) => ({
              position: e.position,
              exerciseId: e.exerciseId,
              reposSec: e.reposSec,
              series: { create: e.series },
            })),
          },
        },
      });
      return "creee";
    } catch (erreur) {
      // Deux envois simultanés du même identifiant : le second bute sur la clé
      // primaire. Ce n'est pas une erreur, c'est un rejeu arrivé en même temps.
      const courant = await proprietaire(saisie.id);
      if (courant === userId) return "existante";
      if (courant) return "conflit";
      throw erreur;
    }
  },
};

// --- La lecture (lot 7) -------------------------------------------------------
// Tout est DÉRIVÉ ici (D58, D65) : volume, séries faites, records. Rien n'est
// stocké, donc rien n'est à recalculer quand une séance change.

/** Ce qu'on lit d'une série. `chargeKg` est un `Decimal` Prisma, ramené ici à un nombre. */
type LigneSerie = {
  type: TypeSerie;
  reps: number | null;
  chargeKg: { toString(): string } | null;
  faite: boolean;
};

const enNombre = (d: { toString(): string } | null) => (d === null ? null : Number(d.toString()));

export type LigneSeance = {
  id: string;
  nom: string;
  debut: Date;
  fin: Date;
  exercices: {
    exerciseId: string;
    exercise: { slug: string; nomFr: string };
    series: LigneSerie[];
  }[];
};

export type SeanceResume = {
  id: string;
  nom: string;
  debut: string;
  fin: string;
  seriesFaites: number;
  volumeKg: number;
};

/** Volume : séries faites, hors échauffement et hors poids du corps (D5). */
export function versResume(l: LigneSeance): SeanceResume {
  let seriesFaites = 0;
  let volumeKg = 0;
  for (const e of l.exercices) {
    for (const s of e.series) {
      if (!s.faite) continue;
      seriesFaites++;
      const charge = enNombre(s.chargeKg);
      if (s.type !== "ECHAUFFEMENT" && s.reps !== null && charge !== null)
        volumeKg += s.reps * charge;
    }
  }
  return {
    id: l.id,
    nom: l.nom,
    debut: l.debut.toISOString(),
    fin: l.fin.toISOString(),
    seriesFaites,
    volumeKg: Math.round(volumeKg * 100) / 100,
  };
}

export type SeanceDetail = SeanceResume & {
  exercices: {
    slug: string;
    nom: string;
    series: {
      type: TypeSerie;
      reps: number | null;
      chargeKg: number | null;
      faite: boolean;
      records: TypeRecord[];
    }[];
  }[];
};

/**
 * Le détail, chaque série portant les records qu'elle a battus À CE MOMENT-LÀ
 * (D64). `anterieur` : par exercice, l'historique chronologique d'AVANT cette
 * séance. Un exercice présent deux fois dans la séance est jugé d'un seul
 * tenant, dans l'ordre : la seconde occurrence se mesure à la première.
 */
export function versDetail(
  l: LigneSeance,
  anterieur: Map<string, (SerieHisto & { date: string })[]>,
): SeanceDetail {
  const marques = new Map<string, TypeRecord[][]>();
  for (const exerciseId of new Set(l.exercices.map((e) => e.exerciseId))) {
    const series = l.exercices
      .filter((e) => e.exerciseId === exerciseId)
      .flatMap((e) => e.series.map((s) => ({ ...s, chargeKg: enNombre(s.chargeKg) })));
    marques.set(exerciseId, marquerRecords(recordsDe(anterieur.get(exerciseId) ?? []), series));
  }
  const curseur = new Map<string, number>();
  return {
    ...versResume(l),
    exercices: l.exercices.map((e) => ({
      slug: e.exercise.slug,
      nom: e.exercise.nomFr,
      series: e.series.map((s) => {
        const i = curseur.get(e.exerciseId) ?? 0;
        curseur.set(e.exerciseId, i + 1);
        return {
          type: s.type,
          reps: s.reps,
          chargeKg: enNombre(s.chargeKg),
          faite: s.faite,
          records: marques.get(e.exerciseId)?.[i] ?? [],
        };
      }),
    })),
  };
}

export type DepotLectureSeances = {
  lister(
    userId: string,
    page: number,
    taille: number,
  ): Promise<{ seances: SeanceResume[]; total: number }>;
  lire(userId: string, id: string): Promise<SeanceDetail | null>;
  /** Par slug, les séries FAITES de la dernière séance qui contenait l'exercice. */
  precedentes(
    userId: string,
    slugs: string[],
  ): Promise<Record<string, { reps: number | null; chargeKg: number | null }[]>>;
  /** Les records actuels ; `null` si l'exercice n'existe pas. */
  records(userId: string, slug: string): Promise<RecordExercice[] | null>;
};

const LECTURE_SEANCE = {
  id: true,
  nom: true,
  debut: true,
  fin: true,
  exercices: {
    orderBy: { position: "asc" },
    select: {
      exerciseId: true,
      exercise: { select: { slug: true, nomFr: true } },
      series: {
        orderBy: { position: "asc" },
        select: { type: true, reps: true, chargeKg: true, faite: true },
      },
    },
  },
} as const;

/** L'historique chronologique d'un utilisateur sur des exercices, avant une date. */
async function historique(userId: string, exerciseIds: string[], avant?: Date) {
  const lignes = await prisma.seanceSerie.findMany({
    where: {
      exercice: {
        exerciseId: { in: exerciseIds },
        seance: { userId, ...(avant ? { debut: { lt: avant } } : {}) },
      },
    },
    orderBy: [
      { exercice: { seance: { debut: "asc" } } },
      { exercice: { position: "asc" } },
      { position: "asc" },
    ],
    select: {
      type: true,
      reps: true,
      chargeKg: true,
      faite: true,
      exercice: { select: { exerciseId: true, seance: { select: { debut: true } } } },
    },
  });
  const parExercice = new Map<string, (SerieHisto & { date: string })[]>();
  for (const l of lignes) {
    const id = l.exercice.exerciseId;
    const liste = parExercice.get(id) ?? [];
    liste.push({
      type: l.type,
      reps: l.reps,
      chargeKg: enNombre(l.chargeKg),
      faite: l.faite,
      date: l.exercice.seance.debut.toISOString(),
    });
    parExercice.set(id, liste);
  }
  return parExercice;
}

export const depotLecture: DepotLectureSeances = {
  async lister(userId, page, taille) {
    const [lignes, total] = await Promise.all([
      prisma.seance.findMany({
        where: { userId },
        orderBy: { debut: "desc" },
        skip: (page - 1) * taille,
        take: taille,
        select: LECTURE_SEANCE,
      }),
      prisma.seance.count({ where: { userId } }),
    ]);
    return { seances: lignes.map((l) => versResume(l as LigneSeance)), total };
  },

  async lire(userId, id) {
    const ligne = await prisma.seance.findFirst({ where: { id, userId }, select: LECTURE_SEANCE });
    if (!ligne) return null;
    const ids = [...new Set(ligne.exercices.map((e) => e.exerciseId))];
    return versDetail(ligne as LigneSeance, await historique(userId, ids, ligne.debut));
  },

  async precedentes(userId, slugs) {
    const paires = await Promise.all(
      slugs.map(async (slug) => {
        const derniere = await prisma.seanceExercice.findFirst({
          where: { exercise: { slug }, seance: { userId } },
          orderBy: [{ seance: { debut: "desc" } }, { position: "desc" }],
          select: {
            series: {
              where: { faite: true },
              orderBy: { position: "asc" },
              select: { reps: true, chargeKg: true },
            },
          },
        });
        return [
          slug,
          (derniere?.series ?? []).map((s) => ({ reps: s.reps, chargeKg: enNombre(s.chargeKg) })),
        ] as const;
      }),
    );
    return Object.fromEntries(paires);
  },

  async records(userId, slug) {
    const exercice = await prisma.exercise.findUnique({ where: { slug }, select: { id: true } });
    if (!exercice) return null;
    return recordsDe((await historique(userId, [exercice.id])).get(exercice.id) ?? []);
  },
};
