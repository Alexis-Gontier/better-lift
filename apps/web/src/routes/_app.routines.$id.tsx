import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/routines/$id")({
  staticData: { crumb: "Détail" },
  component: () => (
    <PagePlaceholder
      title="Routine"
      description="Exercices, séries cibles, supersets et dernière exécution."
    />
  ),
});
