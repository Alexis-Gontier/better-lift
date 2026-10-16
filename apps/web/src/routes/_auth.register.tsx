import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_auth/register")({
  component: () => (
    <PagePlaceholder title="Inscription" description="Nom, e-mail et mot de passe." />
  ),
});
