import { type Metadata } from "next";
import Link from "next/link";

import { Button } from "@better-lift/ui/components/button";

import { RoutineList } from "@/features/routines/routine-list";

export const metadata: Metadata = { title: "Routines — better-lift" };

export default function RoutinesPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Routines</h1>
          <p className="text-muted-foreground">
            Des gabarits de séance. Les modifier ne touche jamais à l’historique.
          </p>
        </div>

        <Button asChild>
          <Link href="/routines/new">Nouvelle routine</Link>
        </Button>
      </header>

      <RoutineList />
    </div>
  );
}
