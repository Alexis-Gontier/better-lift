import { createFileRoute } from "@tanstack/react-router";
import { RoutinePaneNew } from "@/features/routines/routine-pane";

export const Route = createFileRoute("/_app/routines/new")({
  staticData: { crumb: "Nouvelle" },
  component: RoutinePaneNew,
});
