import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/body")({
  staticData: { crumb: "Corps" },
  component: () => (
    <PagePlaceholder
      title="Corps"
      description="Poids avec moyenne sur 7 jours, objectif et mensurations."
    />
  ),
});
