import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/settings/preferences")({
  staticData: { crumb: "Préférences" },
  component: () => (
    <PagePlaceholder
      title="Préférences"
      description="Unités, format de date, premier jour de la semaine, apparence."
    />
  ),
});
