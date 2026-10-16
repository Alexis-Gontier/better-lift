import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/settings/training")({
  staticData: { crumb: "Entraînement" },
  component: () => (
    <PagePlaceholder
      title="Entraînement"
      description="Repos, incréments, barre, disques, formule du 1RM, RPE / RIR."
    />
  ),
});
