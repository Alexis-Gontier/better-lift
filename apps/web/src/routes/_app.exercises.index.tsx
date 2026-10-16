import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/exercises/")({
  component: () => (
    <PagePlaceholder
      title="Exercices"
      description="Catalogue filtrable, détail d'un exercice à droite."
    />
  ),
});
