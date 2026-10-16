import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/planning")({
  staticData: { crumb: "Planning" },
  component: () => (
    <PagePlaceholder
      title="Planning"
      description="Calendrier semaine ou mois : routines planifiées et séances faites."
    />
  ),
});
