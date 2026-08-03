import { type Metadata } from "next";
import Link from "next/link";

import { WorkoutEdit } from "@/features/workouts/workout-edit";

export const metadata: Metadata = { title: "Modifier la séance — better-lift" };

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 : `params` est une promesse, y compris dans un Server Component.
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link
        href={`/workouts/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Séance
      </Link>

      <WorkoutEdit id={id} />
    </div>
  );
}
