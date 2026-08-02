import { type Metadata } from "next";
import Link from "next/link";

import { RoutineEdit } from "@/features/routines/routine-edit";

export const metadata: Metadata = { title: "Modifier la routine — better-lift" };

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link
        href={`/routines/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Aperçu
      </Link>

      <RoutineEdit id={id} />
    </div>
  );
}
