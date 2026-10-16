import { createFileRoute } from "@tanstack/react-router";
import { AuthPlaceholder } from "@/components/auth-placeholder";

export const Route = createFileRoute("/_auth/login")({
  component: () => (
    <AuthPlaceholder
      title="Connexion"
      subtitle="Accéder à better-lift"
      fields="E-mail, mot de passe, « Mot de passe oublié », Se connecter"
      link={{ to: "/register", label: "Pas de compte ? Créer un compte" }}
    />
  ),
});
