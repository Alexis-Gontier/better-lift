import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/progress")({
  staticData: { crumb: "Progression" },
  component: () => (
    <PagePlaceholder
      title="Progression"
      description="Graphiques par période et tableau des records."
    />
  ),
});
