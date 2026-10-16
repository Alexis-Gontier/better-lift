import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/history/")({
  component: () => (
    <PagePlaceholder
      title="Historique"
      description="Séances par mois, détail d'une séance à droite."
    />
  ),
});
