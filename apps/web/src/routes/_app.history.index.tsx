import { createFileRoute } from "@tanstack/react-router";
import { DetailPlaceholder } from "@/components/list-detail";

export const Route = createFileRoute("/_app/history/")({
  component: () => (
    <DetailPlaceholder
      title="Choisissez une séance"
      description="Elle s'ouvre ici, comparée à la précédente de la même routine."
    />
  ),
});
