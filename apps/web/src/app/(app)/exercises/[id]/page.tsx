import { type Metadata } from "next";
import Link from "next/link";

import { ExerciseDetail } from "@/features/exercises/exercise-detail";

/**
 * Titre statique : le rendre dynamique imposerait de lire l'exercice côté
 * serveur, donc de faire voyager le cookie de session jusqu'à l'API depuis le
 * rendu — un aller-retour de plus pour un onglet, alors que la fiche est de
 * toute façon privée et non indexable.
 */
export const metadata: Metadata = { title: "Exercice — better-lift" };

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 : `params` est une promesse, y compris dans un Server Component.
  const { id } = await params;

  return (
    <main className="space-y-6">
      <Link href="/exercises" className="text-sm text-ink-muted hover:text-ink">
        ← Catalogue
      </Link>

      <ExerciseDetail id={id} />
    </main>
  );
}
