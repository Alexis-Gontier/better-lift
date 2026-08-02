import { type Metadata } from "next";

import { AuthScreen } from "@/features/auth/auth-screen";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié — better-lift" };

/**
 * Seul écran d'authentification sans `<Suspense>` : il ne lit aucun paramètre
 * d'URL, donc rien n'empêche son prérendu.
 */
export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      title="Mot de passe oublié"
      description="Indiquez votre adresse, nous vous envoyons un lien pour en choisir un nouveau."
    >
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
