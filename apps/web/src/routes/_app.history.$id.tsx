import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/history/$id")({
  staticData: { crumb: "Détail" },
  component: () => (
    <PagePlaceholder
      title="Séance"
      description="Exercices, séries, records et écart avec la séance précédente."
    />
  ),
});
