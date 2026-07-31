import { type Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe — better-lift" };

/**
 * Page d'arrivée du lien contenu dans l'e-mail. L'API y renvoie après avoir
 * validé le jeton, avec `?token=` ou `?error=INVALID_TOKEN` — d'où la lecture
 * des paramètres, et donc la frontière `<Suspense>`.
 */
export default function ResetPasswordPage() {
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>
        <p className="text-sm text-ink-muted">
          Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-ink-muted">…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
