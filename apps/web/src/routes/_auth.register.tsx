import { createFileRoute } from "@tanstack/react-router";
import { AuthPlaceholder } from "@/components/auth-placeholder";

export const Route = createFileRoute("/_auth/register")({
  component: () => (
    <AuthPlaceholder
      title="Inscription"
      subtitle="Créer un compte"
      fields="Nom, e-mail, mot de passe, Créer le compte"
      link={{ to: "/login", label: "Déjà un compte ? Se connecter" }}
    />
  ),
});
