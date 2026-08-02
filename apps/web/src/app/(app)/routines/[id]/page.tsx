import { type Metadata } from "next";
import Link from "next/link";

import { RoutinePreview } from "@/features/routines/routine-preview";

export const metadata: Metadata = { title: "Routine — better-lift" };

export default async function RoutinePage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 : `params` est une promesse, y compris dans un Server Component.
  const { id } = await params;

  return (
    <main className="space-y-6">
      <Link href="/routines" className="text-sm text-muted-foreground hover:text-foreground">
        ← Routines
      </Link>

      <RoutinePreview id={id} />
    </main>
  );
}
