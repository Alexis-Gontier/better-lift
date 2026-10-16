import { createFileRoute } from "@tanstack/react-router";
import { AuthPlaceholder } from "@/components/auth-placeholder";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: () => (
    <AuthPlaceholder
      title="Mot de passe oublié"
      subtitle="Recevoir un lien de réinitialisation"
      fields="E-mail, Envoyer le lien ; puis écran « e-mail envoyé »"
      link={{ to: "/login", label: "Retour à la connexion" }}
    />
  ),
});
