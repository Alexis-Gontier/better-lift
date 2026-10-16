import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/settings/data")({
  staticData: { crumb: "Données" },
  component: () => (
    <PagePlaceholder
      title="Données"
      description="Import Hevy, export CSV / JSON, suppression des données."
    />
  ),
});
