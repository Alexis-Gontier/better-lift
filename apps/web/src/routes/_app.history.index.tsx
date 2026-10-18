import { createFileRoute } from "@tanstack/react-router";
import { DetailPlaceholder } from "@/components/list-detail";
import { SessionsOnboarding } from "@/features/history/session-list";

export const Route = createFileRoute("/_app/history/")({
  component: () => (
    <DetailPlaceholder
      title="Aucune séance ouverte"
      description="Choisissez-en une pour la relire et la comparer à la précédente."
      empty={<SessionsOnboarding />}
    />
  ),
});
