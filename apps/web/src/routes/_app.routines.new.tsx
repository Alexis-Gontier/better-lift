import { createFileRoute } from "@tanstack/react-router";
import { RoutinePaneNew } from "@/features/routines/routine-pane";

export const Route = createFileRoute("/_app/routines/new")({
  staticData: { crumb: "Nouvelle" },
  // « Nouvelle routine ici » : la routine naît dans ce dossier.
  validateSearch: (s: Record<string, unknown>): { dossier?: string } =>
    typeof s.dossier === "string" && s.dossier !== "" ? { dossier: s.dossier } : {},
  component: NewRoutineRoute,
});

function NewRoutineRoute() {
  const { dossier } = Route.useSearch();
  return <RoutinePaneNew key={dossier ?? "-"} dossier={dossier} />;
}
