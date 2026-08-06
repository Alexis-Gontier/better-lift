import { type Metadata } from "next";

import { BackToList } from "@/features/routines/back-to-list";
import { RoutineEditor } from "@/features/routines/routine-editor";

export const metadata: Metadata = { title: "Nouvelle routine — better-lift" };

export default function NewRoutinePage() {
  return (
    <div className="space-y-6">
      <BackToList />

      <RoutineEditor />
    </div>
  );
}
