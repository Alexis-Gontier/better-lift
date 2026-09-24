import { prisma } from "@better-lift/db";
import type { ExerciceDetail, ExerciceResume, Groupe, RequeteCatalogue } from "@better-lift/shared";
import { normaliserRecherche } from "@better-lift/shared";

/**
 * Le catalogue, côté métier. Ce module ne connaît pas Hono : il ne voit ni
 * requête, ni contexte, ni code de statut.
 *
 * Il est coupé en deux à dessein. Les fonctions PURES portent tout ce qui peut
 * se tromper — le filtre, la projection — et se testent sans base, ce qui compte
 * parce que la CI n'en a pas. Le DÉPÔT ne fait que les appels Prisma, et c'est
 * lui qu'un test de route remplace par un double.
 */

/** Ce qu'on lit en base. Les champs sont ceux du modèle, donc en anglais. */
export type LigneExercice = {
  slug: string;
  /** Le nom anglais du dataset (D44). */
  name: string;
  nomFr: string;
  bodyPart: Groupe;
  equipment: string;
  target: string;
  secondary: string[];
  instructions: string[];
  gifUrl: string | null;
};

// `gifUrl` entre dans le résumé : la liste affiche une vignette par exercice.
const CHAMPS_RESUME = {
  slug: true,
  nomFr: true,
  bodyPart: true,
  equipment: true,
  gifUrl: true,
} as const;
const CHAMPS_DETAIL = {
  ...CHAMPS_RESUME,
  name: true,
  target: true,
  secondary: true,
  instructions: true,
} as const;

export function filtreCatalogue(requete: RequeteCatalogue): Record<string, unknown> {
  const filtre: Record<string, unknown> = { archivedAt: null };

  // LA ligne qui fait tout marcher : la colonne contient les deux noms passés
  // par `normaliserRecherche` (via `texteRecherche`), la saisie doit donc y
  // passer aussi. Comparer la saisie brute ne rendrait jamais rien — et sans
  // erreur pour le dire.
  if (requete.q) filtre.nomRecherche = { contains: normaliserRecherche(requete.q) };
  if (requete.groupe) filtre.bodyPart = requete.groupe;
  if (requete.equipement) filtre.equipment = requete.equipement;

  return filtre;
}

// Ne reçoit que les champs du résumé : c'est tout ce que `CHAMPS_RESUME` lit.
export function versResume(
  ligne: Pick<LigneExercice, "slug" | "nomFr" | "bodyPart" | "equipment" | "gifUrl">,
): ExerciceResume {
  return {
    slug: ligne.slug,
    nom: ligne.nomFr,
    groupe: ligne.bodyPart,
    equipement: ligne.equipment,
    gif: ligne.gifUrl,
  };
}

export function versDetail(ligne: LigneExercice): ExerciceDetail {
  return {
    ...versResume(ligne),
    nomAnglais: ligne.name,
    cible: ligne.target,
    secondaires: ligne.secondary,
    instructions: ligne.instructions,
  };
}

export type DepotExercices = {
  lister(requete: RequeteCatalogue): Promise<{ exercices: ExerciceResume[]; total: number }>;
  parSlug(slug: string): Promise<ExerciceDetail | null>;
};

export const depotPrisma: DepotExercices = {
  async lister(requete) {
    const where = filtreCatalogue(requete);
    const [lignes, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        select: CHAMPS_RESUME,
        orderBy: { nomRecherche: "asc" },
        skip: (requete.page - 1) * requete.taille,
        take: requete.taille,
      }),
      prisma.exercise.count({ where }),
    ]);
    // `bodyPart` sort de Prisma typé par son enum, dont les valeurs sont celles de
    // `Groupe` — `source.test.ts` tient les deux d'accord.
    return {
      exercices: lignes.map((l) => versResume(l as Parameters<typeof versResume>[0])),
      total,
    };
  },

  async parSlug(slug) {
    const ligne = await prisma.exercise.findUnique({
      where: { slug, archivedAt: null },
      select: CHAMPS_DETAIL,
    });
    return ligne ? versDetail(ligne as LigneExercice) : null;
  },
};
