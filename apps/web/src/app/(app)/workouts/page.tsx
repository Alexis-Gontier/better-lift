import { type Metadata } from "next";
import { Suspense } from "react";

import { WorkoutHistory } from "@/features/workouts/workout-history";

export const metadata: Metadata = { title: "Historique — better-lift" };

export default function WorkoutsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Historique</h1>
        <p className="text-muted-foreground">
          Chaque séance terminée, telle qu’elle a été faite. Modifier une routine n’y change rien.
        </p>
      </header>

      {/*
        `useSearchParams` impose une frontière de Suspense : sans elle, Next 16
        bascule la page entière en rendu dynamique et le build le refuse.
      */}
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
        <WorkoutHistory />
      </Suspense>
    </div>
  );
}
