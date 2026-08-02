import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ExerciseCatalog } from "@/features/exercises/exercise-catalog";

export const metadata: Metadata = { title: "Exercices — better-lift" };

/**
 * Coquille serveur du catalogue. Le contenu est client : la recherche est
 * instantanée et les filtres se lisent dans l'URL, deux choses qu'un Server
 * Component ne sait pas faire sans un aller-retour par frappe.
 *
 * `<Suspense>` n'est pas décoratif ici : `useSearchParams()` suspend au rendu
 * statique, et Next refuse de construire la page sans cette limite.
 */
export default function ExercisesPage() {
  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Exercices</h1>
          <p className="text-ink-muted">
            Le catalogue commun et vos exercices personnalisés, dans la langue du profil.
          </p>
        </div>

        <Link
          href="/exercises/new"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-surface"
        >
          Créer un exercice
        </Link>
      </header>

      <Suspense fallback={null}>
        <ExerciseCatalog />
      </Suspense>
    </main>
  );
}
