import { prisma } from "@better-lift/db";
import type { Dossier } from "@better-lift/shared";

/**
 * Les dossiers de routines (D296), côté métier. Ce module ne connaît pas Hono. Chaque méthode
 * reçoit `userId` et filtre par lui (D53).
 */

export class NomPris extends Error {
  constructor() {
    super("Un dossier porte déjà ce nom.");
  }
}

export type DepotDossiers = {
  /** Dans l'ordre de l'utilisateur. */
  lister(userId: string): Promise<Dossier[]>;
  /** En dernière position. Rend l'identifiant ; lève `NomPris`. */
  creer(userId: string, nom: string): Promise<string>;
  /** `false` s'il n'est pas à lui ; lève `NomPris`. */
  renommer(userId: string, id: string, nom: string): Promise<boolean>;
  /** Ses routines passent « Sans dossier » (`onDelete: SetNull`). */
  supprimer(userId: string, id: string): Promise<boolean>;
  /** `false` si un identifiant n'est pas à lui : rien n'est alors modifié. */
  ordonner(userId: string, ids: string[]): Promise<boolean>;
};

/** P2002 : la contrainte unique `(userId, nom)` a refusé l'écriture. */
const estNomPris = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e && e.code === "P2002";

export const depotDossiers: DepotDossiers = {
  async lister(userId) {
    return prisma.dossier.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true, nom: true },
    });
  },

  async creer(userId, nom) {
    const dernier = await prisma.dossier.aggregate({
      where: { userId },
      _max: { position: true },
    });
    try {
      const cree = await prisma.dossier.create({
        data: { userId, nom, position: (dernier._max.position ?? -1) + 1 },
        select: { id: true },
      });
      return cree.id;
    } catch (e) {
      if (estNomPris(e)) throw new NomPris();
      throw e;
    }
  },

  async renommer(userId, id, nom) {
    try {
      const { count } = await prisma.dossier.updateMany({ where: { id, userId }, data: { nom } });
      return count > 0;
    } catch (e) {
      if (estNomPris(e)) throw new NomPris();
      throw e;
    }
  },

  async supprimer(userId, id) {
    const { count } = await prisma.dossier.deleteMany({ where: { id, userId } });
    return count > 0;
  },

  async ordonner(userId, ids) {
    return prisma.$transaction(async (tx) => {
      const siens = await tx.dossier.count({ where: { userId, id: { in: ids } } });
      if (siens !== ids.length) return false;
      await Promise.all(
        ids.map((id, position) => tx.dossier.update({ where: { id }, data: { position } })),
      );
      return true;
    });
  },
};
