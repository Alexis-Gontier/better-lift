import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_app/settings/account")({
  staticData: { crumb: "Compte" },
  component: () => (
    <PagePlaceholder
      title="Compte"
      description="Profil, sécurité, sessions ouvertes et zone de danger."
    />
  ),
});
