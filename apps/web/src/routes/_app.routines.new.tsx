import { createFileRoute } from "@tanstack/react-router";
import { RoutineEditor } from "@/features/routines/routine-editor";

export const Route = createFileRoute("/_app/routines/new")({
  staticData: { crumb: "Nouvelle" },
  component: () => <RoutineEditor />,
});
