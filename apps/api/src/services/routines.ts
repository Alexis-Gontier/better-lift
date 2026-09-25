import { prisma } from "@better-lift/db";
import type { RoutineDetail, RoutineResume, RoutineSaisie, TypeSerie } from "@better-lift/shared";
import { imageDe } from "./exercices.js";

/**
 * Les routines, côté métier. Ce module ne connaît pas Hono.
 *
 * Même découpage qu'au catalogue : des fonctions PURES pour tout ce qui peut se
 * tromper — positions, résolution des slugs, conversion des charges — testées
 * sans base, parce que la CI n'en a pas ; et un DÉPÔT qui ne fait que Prisma.
 * Chaque méthode du dépôt reçoit `userId` et filtre par lui (D53).
 */

export class SlugInconnu extends Error {
  constructor(readonly slug: string) {
    super(`Exercice inconnu du catalogue : « ${slug} ».`);
  }
}

type SerieEcrite = {
  position: number;
  type: TypeSerie;
  repsCible: number | null;
  chargeCibleKg: number | null;
};
type ExerciceEcrit = {
  position: number;
  exerciseId: string;
  reposSec: number | null;
  series: SerieEcrite[];
};

/** La saisie, prête à écrire. L'ordre des tableaux devient la position (D50). */
export function versEcriture(
  saisie: RoutineSaisie,
  idsParSlug: Map<string, string>,
): { nom: string; exercices: ExerciceEcrit[] } {
  return {
    nom: saisie.nom,
    exercices: saisie.exercices.map((e, position) => {
      const exerciseId = idsParSlug.get(e.slug);
      if (!exerciseId) throw new SlugInconnu(e.slug);
      return {
        position,
        exerciseId,
        reposSec: e.reposSec,
        series: e.series.map((s, i) => ({ position: i, ...s })),
      };
    }),
  };
}

/**
 * Ce qu'on lit en base. `chargeCibleKg` est un `Decimal` Prisma : un objet, que
 * l'on ramène à un nombre ici et nulle part ailleurs.
 */
export type LigneRoutine = {
  id: string;
  nom: string;
  exercices: {
    reposSec: number | null;
    exercise: {
      slug: string;
      nomFr: string;
      gifUrl: string | null;
      target: string;
      secondary: string[];
    };
    series: {
      type: TypeSerie;
      repsCible: number | null;
      chargeCibleKg: { toString(): string } | null;
    }[];
  }[];
};

export function versDetail(l: LigneRoutine): RoutineDetail {
  return {
    id: l.id,
    nom: l.nom,
    exercices: l.exercices.map((e) => ({
      slug: e.exercise.slug,
      nom: e.exercise.nomFr,
      image: imageDe(e.exercise.gifUrl),
      musclePrincipal: e.exercise.target,
      musclesSecondaires: e.exercise.secondary,
      reposSec: e.reposSec,
      series: e.series.map((s) => ({
        type: s.type,
        repsCible: s.repsCible,
        chargeCibleKg: s.chargeCibleKg === null ? null : Number(s.chargeCibleKg.toString()),
      })),
    })),
  };
}

export function versResume(l: LigneRoutine): RoutineResume {
  return {
    id: l.id,
    nom: l.nom,
    nbExercices: l.exercices.length,
    nbSeries: l.exercices.reduce((n, e) => n + e.series.length, 0),
  };
}

export type DepotRoutines = {
  lister(userId: string): Promise<RoutineResume[]>;
  lire(userId: string, id: string): Promise<RoutineDetail | null>;
  /** Rend l'identifiant créé. Lève `SlugInconnu`. */
  creer(userId: string, saisie: RoutineSaisie): Promise<string>;
  /** `false` si la routine n'existe pas ou n'est pas à lui. Lève `SlugInconnu`. */
  remplacer(userId: string, id: string, saisie: RoutineSaisie): Promise<boolean>;
  supprimer(userId: string, id: string): Promise<boolean>;
  /** `false` si un identifiant n'est pas à lui : rien n'est alors modifié. */
  ordonner(userId: string, ids: string[]): Promise<boolean>;
};

const LECTURE = {
  id: true,
  nom: true,
  exercices: {
    orderBy: { position: "asc" },
    select: {
      reposSec: true,
      exercise: {
        select: { slug: true, nomFr: true, gifUrl: true, target: true, secondary: true },
      },
      series: {
        orderBy: { position: "asc" },
        select: { type: true, repsCible: true, chargeCibleKg: true },
      },
    },
  },
} as const;

/** Les slugs de la saisie, résolus en identifiants. Un exercice archivé ne se résout pas. */
async function resoudre(saisie: RoutineSaisie): Promise<Map<string, string>> {
  const slugs = [...new Set(saisie.exercices.map((e) => e.slug))];
  const lignes = await prisma.exercise.findMany({
    where: { slug: { in: slugs }, archivedAt: null },
    select: { id: true, slug: true },
  });
  return new Map(lignes.map((l) => [l.slug, l.id]));
}

/** Les exercices à créer, sous la forme imbriquée qu'attend Prisma. */
function creationImbriquee(ecriture: ReturnType<typeof versEcriture>) {
  return {
    create: ecriture.exercices.map((e) => ({
      position: e.position,
      exerciseId: e.exerciseId,
      reposSec: e.reposSec,
      series: { create: e.series },
    })),
  };
}

export const depotPrisma: DepotRoutines = {
  async lister(userId) {
    const lignes = await prisma.routine.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: LECTURE,
    });
    return lignes.map((l) => versResume(l as LigneRoutine));
  },

  async lire(userId, id) {
    const ligne = await prisma.routine.findFirst({ where: { id, userId }, select: LECTURE });
    return ligne ? versDetail(ligne as LigneRoutine) : null;
  },

  async creer(userId, saisie) {
    const ecriture = versEcriture(saisie, await resoudre(saisie));
    // En dernière position : une routine neuve s'ajoute au bas de la liste.
    const derniere = await prisma.routine.aggregate({
      where: { userId },
      _max: { position: true },
    });
    const creee = await prisma.routine.create({
      data: {
        userId,
        nom: ecriture.nom,
        position: (derniere._max.position ?? -1) + 1,
        exercices: creationImbriquee(ecriture),
      },
      select: { id: true },
    });
    return creee.id;
  },

  async remplacer(userId, id, saisie) {
    const ecriture = versEcriture(saisie, await resoudre(saisie));
    return prisma.$transaction(async (tx) => {
      // L'appartenance se vérifie DANS la transaction : entre une vérification
      // faite avant et l'écriture, la routine pourrait avoir été supprimée.
      const existe = await tx.routine.findFirst({ where: { id, userId }, select: { id: true } });
      if (!existe) return false;
      // Remplacement complet (D50) : les séries partent en cascade.
      await tx.routineExercice.deleteMany({ where: { routineId: id } });
      await tx.routine.update({
        where: { id },
        data: { nom: ecriture.nom, exercices: creationImbriquee(ecriture) },
      });
      return true;
    });
  },

  async supprimer(userId, id) {
    const { count } = await prisma.routine.deleteMany({ where: { id, userId } });
    return count > 0;
  },

  async ordonner(userId, ids) {
    return prisma.$transaction(async (tx) => {
      const siennes = await tx.routine.count({ where: { userId, id: { in: ids } } });
      if (siennes !== ids.length) return false;
      await Promise.all(
        ids.map((id, position) => tx.routine.update({ where: { id }, data: { position } })),
      );
      return true;
    });
  },
};
