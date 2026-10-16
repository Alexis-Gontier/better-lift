import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  component: () => (
    <PagePlaceholder
      title="Accueil"
      description="Aujourd'hui, la semaine, la régularité, les objectifs et le poids."
    />
  ),
});
