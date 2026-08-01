import { Prisma, prisma } from "@better-lift/db";
import { type CurrentUser, type UpdateMeInput } from "@better-lift/validators";

import { ApiError, notFound } from "../lib/errors.js";

/**
 * Profil et préférences de l'utilisateur connecté (doc 04, § Compte).
 *
 * Aucune fonction d'ici ne prend l'identifiant depuis une entrée client : la
 * route le lit dans `c.get("user")`, posé par le middleware d'authentification
 * (règle non négociable n°8).
 */

/** Ligne telle que la base la renvoie, avant sérialisation du contrat. */
type UserRow = Prisma.UserGetPayload<{ select: typeof SELECTION }>;

/**
 * Sélection explicite plutôt qu'un `include` : les colonnes de Better Auth qui
 * ne concernent pas le client — jetons, comptes liés — n'ont rien à sortir
 * d'ici par inadvertance le jour où le schéma en gagne.
 */
const SELECTION = {
  id: true,
  email: true,
  name: true,
  emailVerified: true,
  image: true,
  createdAt: true,
  username: true,
  bio: true,
  unitSystem: true,
  locale: true,
  timezone: true,
  defaultRestSec: true,
  defaultVisibility: true,
  onboardedAt: true,
} satisfies Prisma.UserSelect;

function toCurrentUser(row: UserRow): CurrentUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: row.emailVerified,
    image: row.image,
    createdAt: row.createdAt.toISOString(),
    username: row.username,
    bio: row.bio,
    unitSystem: row.unitSystem,
    /**
     * La colonne est un `String` libre en base, pas une énumération : Better
     * Auth crée des comptes sans passer par nos validateurs, et une valeur
     * inattendue ne doit pas faire échouer la lecture du profil. On retombe
     * sur le français, qui est la valeur par défaut de la colonne.
     */
    locale: row.locale === "en" ? "en" : "fr",
    timezone: row.timezone,
    defaultRestSec: row.defaultRestSec,
    defaultVisibility: row.defaultVisibility,
    onboardedAt: row.onboardedAt?.toISOString() ?? null,
  };
}

export async function getCurrentUser(userId: string): Promise<CurrentUser> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: SELECTION });

  if (!row) {
    /**
     * Une session valide dont l'utilisateur a disparu : compte supprimé
     * pendant que la session courait (D18, suppression immédiate en cascade).
     * Le cas est rare mais réel, et un 404 vaut mieux qu'un plantage.
     */
    throw notFound("Utilisateur");
  }

  return toCurrentUser(row);
}

export async function updateCurrentUser(
  userId: string,
  input: UpdateMeInput,
): Promise<CurrentUser> {
  /**
   * Le pseudo est unique. On pourrait le vérifier avant d'écrire, mais entre
   * la lecture et l'écriture deux inscriptions concurrentes peuvent choisir le
   * même : seule la contrainte de base tranche vraiment. On écrit donc, et on
   * traduit la violation — c'est la seule version sans fenêtre de course.
   */
  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: SELECTION,
    });

    return toCurrentUser(row);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 : violation de contrainte d'unicité.
      if (error.code === "P2002") {
        throw new ApiError("CONFLICT", "Ce pseudo est déjà pris.", [
          { path: "username", message: "Déjà utilisé." },
        ]);
      }

      // P2025 : la ligne visée n'existe plus.
      if (error.code === "P2025") {
        throw notFound("Utilisateur");
      }
    }

    throw error;
  }
}
