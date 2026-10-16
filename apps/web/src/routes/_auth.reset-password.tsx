import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_auth/reset-password")({
  component: () => (
    <PagePlaceholder title="Nouveau mot de passe" description="Choisir un nouveau mot de passe." />
  ),
});
