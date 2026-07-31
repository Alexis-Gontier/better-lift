import { type Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié — better-lift" };

export default function ForgotPasswordPage() {
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
        <p className="text-sm text-ink-muted">
          Indiquez votre adresse, nous vous envoyons un lien pour en choisir un nouveau.
        </p>
      </header>

      <ForgotPasswordForm />
    </>
  );
}
