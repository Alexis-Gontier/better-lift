import { createFileRoute } from "@tanstack/react-router";
import { DetailPlaceholder } from "@/components/list-detail";

export const Route = createFileRoute("/_app/routines/")({
  component: () => (
    <DetailPlaceholder
      title="Choisissez une routine"
      description="Elle s'ouvre ici, prête à être relue ou modifiée."
    />
  ),
});
