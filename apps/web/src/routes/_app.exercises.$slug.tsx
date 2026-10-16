import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/exercises/$slug")({
  staticData: { crumb: "Détail" },
  component: () => (
    <PagePlaceholder title="Exercice" description="Résumé, historique et records de l'exercice." />
  ),
});
