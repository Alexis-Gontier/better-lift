import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";

export const Route = createFileRoute("/routines")({ component: Routines });

function Routines() {
  return <AppShell liste={<p className="p-4">Écran à venir.</p>} />;
}
