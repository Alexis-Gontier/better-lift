import { type Metadata } from "next";
import Link from "next/link";

import { WorkoutDetail } from "@/features/workouts/workout-detail";

export const metadata: Metadata = { title: "Séance — better-lift" };

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 : `params` est une promesse, y compris dans un Server Component.
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link href="/workouts" className="text-sm text-muted-foreground hover:text-foreground">
        ← Historique
      </Link>

      <WorkoutDetail id={id} />
    </div>
  );
}
