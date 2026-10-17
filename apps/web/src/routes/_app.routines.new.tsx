import { createFileRoute } from "@tanstack/react-router";
import { useProto } from "@/components/proto/use-proto";
import { RoutinePaneNew } from "@/features/routines/routine-pane";

export const Route = createFileRoute("/_app/routines/new")({
  staticData: { crumb: "Nouvelle" },
  component: NewRoutinePane,
});

function NewRoutinePane() {
  const { variant } = useProto();
  return <RoutinePaneNew bare={variant === "a"} />;
}
