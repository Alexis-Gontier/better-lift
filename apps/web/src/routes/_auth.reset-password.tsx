import { createFileRoute } from "@tanstack/react-router";
import { AuthPlaceholder } from "@/components/auth-placeholder";

export const Route = createFileRoute("/_auth/reset-password")({
  component: () => (
    <AuthPlaceholder
      title="Nouveau mot de passe"
      subtitle="Choisir un nouveau mot de passe"
      fields="Nouveau mot de passe, confirmation ; lien expiré = état erreur"
      link={{ to: "/login", label: "Retour à la connexion" }}
    />
  ),
});
