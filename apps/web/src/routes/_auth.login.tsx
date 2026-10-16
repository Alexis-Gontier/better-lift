import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/page-placeholder";

export const Route = createFileRoute("/_auth/login")({
  component: () => <PagePlaceholder title="Connexion" description="E-mail et mot de passe." />,
});
