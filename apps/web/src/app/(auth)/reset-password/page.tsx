import { type Metadata } from "next";
import { Suspense } from "react";

import { AuthScreen } from "@/features/auth/auth-screen";
import { FormSkeleton } from "@/features/auth/form-skeleton";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe — better-lift" };

/**
 * Page d'arrivée du lien contenu dans l'e-mail. L'API y renvoie après avoir
 * validé le jeton, avec `?token=` ou `?error=INVALID_TOKEN` — d'où la lecture
 * des paramètres, et donc la frontière `<Suspense>`.
 */
export default function ResetPasswordPage() {
  return (
    <AuthScreen
      title="Nouveau mot de passe"
      description="Choisissez un mot de passe que vous n’utilisez nulle part ailleurs."
    >
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthScreen>
  );
}
