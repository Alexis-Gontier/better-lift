import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: () => (
    <PagePlaceholder
      title="Mot de passe oublié"
      description="Recevoir un lien de réinitialisation."
    />
  ),
});
