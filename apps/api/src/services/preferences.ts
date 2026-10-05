import { prisma } from "@better-lift/db";
import { PREFERENCES_DEFAUT, type Preferences } from "@better-lift/shared";

/** Les préférences du compte (D129), côté métier. Ce module ne connaît pas Hono. */
export type DepotPreferences = {
  /** Celles de l'utilisateur, ou les valeurs par défaut s'il n'a encore rien réglé. */
  lire(userId: string): Promise<Preferences>;
  /** Les remplace en entier, et rend ce qui est enregistré. */
  ecrire(userId: string, p: Preferences): Promise<Preferences>;
};

const CHAMPS = { objectifHebdo: true, reposDefautSec: true } as const;

export const depotPreferences: DepotPreferences = {
  async lire(userId) {
    const p = await prisma.preferences.findUnique({ where: { userId }, select: CHAMPS });
    return p ?? PREFERENCES_DEFAUT;
  },
  // La ligne naît au premier enregistrement : `upsert`, pas de création à l'inscription.
  async ecrire(userId, p) {
    return prisma.preferences.upsert({
      where: { userId },
      create: { userId, ...p },
      update: p,
      select: CHAMPS,
    });
  },
};
