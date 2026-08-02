import { type Metadata } from "next";
import Link from "next/link";

import { ExerciseForm } from "@/features/exercises/exercise-form";

export const metadata: Metadata = { title: "Nouvel exercice — better-lift" };

export default function NewExercisePage() {
  return (
    <main className="space-y-6">
      <Link href="/exercises" className="text-sm text-ink-muted hover:text-ink">
        ← Catalogue
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Nouvel exercice</h1>
        <p className="text-ink-muted">
          Visible de vous seul. Utile quand le catalogue ne connaît pas un mouvement de votre salle,
          ou une variante que vous êtes seul à faire.
        </p>
      </header>

      <ExerciseForm />
    </main>
  );
}
