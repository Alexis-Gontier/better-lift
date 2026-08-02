import { type Metadata } from "next";
import Link from "next/link";

import { RoutineEdit } from "@/features/routines/routine-edit";

export const metadata: Metadata = { title: "Modifier la routine — better-lift" };

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="space-y-6">
      <Link href={`/routines/${id}`} className="text-sm text-ink-muted hover:text-ink">
        ← Aperçu
      </Link>

      <RoutineEdit id={id} />
    </main>
  );
}
