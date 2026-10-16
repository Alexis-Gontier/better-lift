import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/routines/new")({
  staticData: { crumb: "Nouvelle" },
  component: () => (
    <PagePlaceholder
      title="Nouvelle routine"
      description="Éditeur : exercices réordonnables, séries, supersets, notes."
    />
  ),
});
