import { createFileRoute } from "@tanstack/react-router";
import { DetailPlaceholder } from "@/components/list-detail";

export const Route = createFileRoute("/_app/exercises/")({
  component: () => (
    <DetailPlaceholder
      title="Aucun exercice ouvert"
      description="Choisissez-en un pour sa progression, son historique et ses records."
    />
  ),
});
