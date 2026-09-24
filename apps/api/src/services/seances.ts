import { prisma } from "@better-lift/db";
import type { SeanceSaisie, TypeSerie } from "@better-lift/shared";
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

export type IssueEnregistrement = "creee" | "existante" | "conflit";

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
