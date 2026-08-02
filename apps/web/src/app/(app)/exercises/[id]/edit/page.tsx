import { type Metadata } from "next";
import Link from "next/link";

import { ExerciseEdit } from "@/features/exercises/exercise-edit";

export const metadata: Metadata = { title: "Modifier un exercice — better-lift" };

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 : `params` est une promesse, y compris dans un Server Component.
  const { id } = await params;

  return (
    <main className="space-y-6">
      <Link href={`/exercises/${id}`} className="text-sm text-ink-muted hover:text-ink">
        ← Fiche
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Modifier l’exercice</h1>

      <ExerciseEdit id={id} />
    </main>
  );
}
