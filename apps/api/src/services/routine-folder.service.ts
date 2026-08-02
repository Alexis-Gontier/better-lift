import { prisma } from "@better-lift/db";
import { type RoutineFolder, type RoutineFolderInput } from "@better-lift/validators";

import { notFound } from "../lib/errors.js";

/**
 * Dossiers de routines (doc 04, § Dossiers).
 *
 * Un dossier n'est qu'un rangement : le supprimer ne supprime jamais son
 * contenu, les routines remontent à la racine. C'est `onDelete: SetNull` sur
 * `Routine.folderId` qui le garantit, en base plutôt qu'en code — une garantie
 * qu'aucun oubli d'appel ne peut contourner.
 *
 * L'appartenance est vérifiée **ici**, dans le service, jamais dans la route
 * (règle non négociable n°8), et un dossier d'autrui répond 404.
 */

type FolderRow = {
  id: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { routines: number };
};

function toFolder(row: FolderRow): RoutineFolder {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    routineCount: row._count.routines,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Le compteur exclut les routines supprimées : une suppression logique laisse
 * la ligne en base, et l'afficher ferait mentir « 3 routines » sur un dossier
 * qui n'en montre qu'une.
 */
const COUNT_LIVE_ROUTINES = {
  _count: { select: { routines: { where: { deletedAt: null } } } },
} as const;

export async function listFolders(userId: string): Promise<RoutineFolder[]> {
  const rows = await prisma.routineFolder.findMany({
    where: { userId },
    // `id` départage les positions égales : sans lui, deux dossiers créés dans
    // la même seconde changeraient d'ordre d'un affichage à l'autre.
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: COUNT_LIVE_ROUTINES,
  });

  return rows.map(toFolder);
}

export async function createFolder(
  input: RoutineFolderInput,
  userId: string,
): Promise<RoutineFolder> {
  /**
   * Le nouveau dossier se range en dernier. `max + 1` plutôt que `count()` :
   * les deux divergent dès qu'un dossier a été supprimé, et deux dossiers à la
   * même position rendraient l'ordre non déterministe.
   */
  const last = await prisma.routineFolder.aggregate({
    where: { userId },
    _max: { position: true },
  });

  const row = await prisma.routineFolder.create({
    data: {
      userId,
      name: input.name,
      position: (last._max.position ?? -1) + 1,
    },
    include: COUNT_LIVE_ROUTINES,
  });

  return toFolder(row);
}

export async function updateFolder(
  id: string,
  input: RoutineFolderInput,
  userId: string,
): Promise<RoutineFolder> {
  /**
   * `updateMany` filtré sur le propriétaire plutôt qu'un `findFirst` suivi d'un
   * `update` : une seule requête, et surtout aucune fenêtre entre la
   * vérification et l'écriture.
   */
  const { count } = await prisma.routineFolder.updateMany({
    where: { id, userId },
    data: { name: input.name },
  });

  if (count === 0) {
    throw notFound("Dossier");
  }

  const row = await prisma.routineFolder.findUniqueOrThrow({
    where: { id },
    include: COUNT_LIVE_ROUTINES,
  });

  return toFolder(row);
}

export async function deleteFolder(id: string, userId: string): Promise<void> {
  const { count } = await prisma.routineFolder.deleteMany({ where: { id, userId } });

  if (count === 0) {
    throw notFound("Dossier");
  }
}

/**
 * Réordonne les dossiers d'après la liste **complète** des identifiants.
 *
 * Les identifiants inconnus ou appartenant à autrui sont simplement ignorés :
 * la requête vient d'un glisser-déposer, et faire échouer tout le
 * réordonnancement parce qu'un dossier a été supprimé dans un autre onglet
 * serait pénible pour rien. Ce qui compte est que l'ordre final soit celui
 * qu'on voit à l'écran.
 */
export async function reorderFolders(ids: string[], userId: string): Promise<RoutineFolder[]> {
  const owned = await prisma.routineFolder.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });

  const ownedIds = new Set(owned.map((row) => row.id));
  const ordered = ids.filter((id) => ownedIds.has(id));

  // Une transaction : un ordre à moitié appliqué serait pire que pas d'ordre.
  await prisma.$transaction(
    ordered.map((id, position) =>
      prisma.routineFolder.update({ where: { id }, data: { position } }),
    ),
  );

  return listFolders(userId);
}
