import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/routines/")({
  component: () => (
    <PagePlaceholder
      title="Routines"
      description="Dossiers de routines, détail d'une routine à droite."
    />
  ),
});
