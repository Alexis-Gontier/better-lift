import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/routines/$id_/edit")({
  staticData: { crumb: "Modifier" },
  component: () => (
    <PagePlaceholder
      title="Modifier la routine"
      description="Éditeur : exercices réordonnables, séries, supersets, notes."
    />
  ),
});
