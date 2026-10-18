import { prisma } from "@better-lift/db";
import {
  dureeEstimeeSec,
  normaliserGroupes,
  type RoutineDetail,
  type RoutineResume,
  type RoutineSaisie,
  type TypeSerie,
} from "@better-lift/shared";
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

/** Le dossier donné n'existe pas ou n'est pas à lui : introuvable, comme sa routine (D297). */
export class DossierInconnu extends Error {
  constructor() {
    super("Dossier introuvable.");
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
  supersetGroupe: number | null;
  series: SerieEcrite[];
};

/** La saisie, prête à écrire. L'ordre des tableaux devient la position (D50). */
export function versEcriture(
  saisie: RoutineSaisie,
  idsParSlug: Map<string, string>,
): { nom: string; note?: string | null; dossierId?: string | null; exercices: ExerciceEcrit[] } {
  return {
    nom: saisie.nom,
    // D298 : absents de la saisie, ils restent absents — donc inchangés en base.
    ...(saisie.note !== undefined && { note: saisie.note }),
    ...(saisie.dossierId !== undefined && { dossierId: saisie.dossierId }),
    // D146 : un groupe mal formé se corrige, il ne fait pas refuser la routine.
    exercices: normaliserGroupes(saisie.exercices).map((e, position) => {
      const exerciseId = idsParSlug.get(e.slug);
      if (!exerciseId) throw new SlugInconnu(e.slug);
      return {
        position,
        exerciseId,
        reposSec: e.reposSec,
        supersetGroupe: e.supersetGroupe ?? null,
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
  note: string | null;
  dossierId: string | null;
  /** La dernière séance faite depuis la routine, au plus une (D310). */
  seances: { debut: Date }[];
  exercices: {
    reposSec: number | null;
    supersetGroupe: number | null;
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
    note: l.note,
    dossierId: l.dossierId,
    exercices: l.exercices.map((e) => ({
      slug: e.exercise.slug,
      nom: e.exercise.nomFr,
      image: imageDe(e.exercise.gifUrl),
      musclePrincipal: e.exercise.target,
      musclesSecondaires: e.exercise.secondary,
      reposSec: e.reposSec,
      supersetGroupe: e.supersetGroupe,
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
    dossierId: l.dossierId,
    derniereSeance: l.seances[0]?.debut.toISOString() ?? null,
    exercices: l.exercices.map((e) => ({
      nom: e.exercise.nomFr,
      musclePrincipal: e.exercise.target,
    })),
    dureeEstimeeSec: dureeEstimeeSec(l.exercices),
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
  /** Range la routine dans un dossier, `null` : « Sans dossier ». `false` si elle n'est pas à lui ; lève `DossierInconnu`. */
  deplacer(userId: string, id: string, dossierId: string | null): Promise<boolean>;
};

const LECTURE = {
  id: true,
  nom: true,
  note: true,
  dossierId: true,
  seances: { orderBy: { debut: "desc" }, take: 1, select: { debut: true } },
  exercices: {
    orderBy: { position: "asc" },
    select: {
      reposSec: true,
      supersetGroupe: true,
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

/**
 * Un dossier donné doit être à lui : celui d'autrui est introuvable (D297). Vérifié DANS la
 * transaction de l'écriture, pour qu'il ne disparaisse pas entre-temps.
 */
async function verifierDossier(
  tx: Pick<typeof prisma, "dossier">,
  userId: string,
  dossierId: string | null | undefined,
) {
  if (!dossierId) return;
  const sien = await tx.dossier.findFirst({
    where: { id: dossierId, userId },
    select: { id: true },
  });
  if (!sien) throw new DossierInconnu();
}

/** Les exercices à créer, sous la forme imbriquée qu'attend Prisma. */
function creationImbriquee(ecriture: ReturnType<typeof versEcriture>) {
  return {
    create: ecriture.exercices.map((e) => ({
      position: e.position,
      exerciseId: e.exerciseId,
      reposSec: e.reposSec,
      supersetGroupe: e.supersetGroupe,
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
    return prisma.$transaction(async (tx) => {
      await verifierDossier(tx, userId, ecriture.dossierId);
      // En dernière position : une routine neuve s'ajoute au bas de la liste.
      const derniere = await tx.routine.aggregate({
        where: { userId },
        _max: { position: true },
      });
      const creee = await tx.routine.create({
        data: {
          userId,
          nom: ecriture.nom,
          note: ecriture.note ?? null,
          dossierId: ecriture.dossierId ?? null,
          position: (derniere._max.position ?? -1) + 1,
          exercices: creationImbriquee(ecriture),
        },
        select: { id: true },
      });
      return creee.id;
    });
  },

  async remplacer(userId, id, saisie) {
    const ecriture = versEcriture(saisie, await resoudre(saisie));
    return prisma.$transaction(async (tx) => {
      // L'appartenance se vérifie DANS la transaction : entre une vérification
      // faite avant et l'écriture, la routine pourrait avoir été supprimée.
      const existe = await tx.routine.findFirst({ where: { id, userId }, select: { id: true } });
      if (!existe) return false;
      await verifierDossier(tx, userId, ecriture.dossierId);
      // Remplacement complet (D50) : les séries partent en cascade. Note et dossier ne
      // changent que s'ils sont donnés (D298).
      await tx.routineExercice.deleteMany({ where: { routineId: id } });
      await tx.routine.update({
        where: { id },
        data: {
          nom: ecriture.nom,
          ...(ecriture.note !== undefined && { note: ecriture.note }),
          ...(ecriture.dossierId !== undefined && { dossierId: ecriture.dossierId }),
          exercices: creationImbriquee(ecriture),
        },
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

  async deplacer(userId, id, dossierId) {
    return prisma.$transaction(async (tx) => {
      await verifierDossier(tx, userId, dossierId);
      const { count } = await tx.routine.updateMany({ where: { id, userId }, data: { dossierId } });
      return count > 0;
    });
  },
};
