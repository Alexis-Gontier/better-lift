import { createFileRoute } from "@tanstack/react-router";
import { DetailPlaceholder } from "@/components/list-detail";

export const Route = createFileRoute("/_app/exercises/")({
  component: () => (
    <DetailPlaceholder
      title="Choisissez un exercice"
      description="Sa fiche s'ouvre ici : progression, historique et records."
    />
  ),
});
