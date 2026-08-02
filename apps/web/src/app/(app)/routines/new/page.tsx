import { type Metadata } from "next";
import Link from "next/link";

import { RoutineEditor } from "@/features/routines/routine-editor";

export const metadata: Metadata = { title: "Nouvelle routine — better-lift" };

export default function NewRoutinePage() {
  return (
    <main className="space-y-6">
      <Link href="/routines" className="text-sm text-muted-foreground hover:text-foreground">
        ← Routines
      </Link>

      <RoutineEditor />
    </main>
  );
}
