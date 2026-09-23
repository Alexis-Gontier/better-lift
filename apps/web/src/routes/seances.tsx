import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/app-shell";

export const Route = createFileRoute("/seances")({ component: Seances });

function Seances() {
  return <AppShell liste={<p className="p-4">Écran à venir.</p>} />;
}
