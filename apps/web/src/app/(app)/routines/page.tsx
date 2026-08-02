import { type Metadata } from "next";
import Link from "next/link";

import { RoutineList } from "@/features/routines/routine-list";

export const metadata: Metadata = { title: "Routines — better-lift" };

export default function RoutinesPage() {
  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Routines</h1>
          <p className="text-muted-foreground">
            Des gabarits de séance. Les modifier ne touche jamais à l’historique.
          </p>
        </div>

        <Link
          href="/routines/new"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Nouvelle routine
        </Link>
      </header>

      <RoutineList />
    </main>
  );
}
