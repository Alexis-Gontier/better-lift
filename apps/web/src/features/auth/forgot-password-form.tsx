"use client";

import Link from "next/link";
import { useState } from "react";

import { Field, FormError, FormSuccess, SubmitButton } from "./form-parts";
import { requestPasswordReset } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await requestPasswordReset({
      email,
      /**
       * Page vers laquelle l'API renvoie **après** avoir validé le jeton. Le
       * détour par l'API est ce qui évite d'afficher un formulaire pour un lien
       * déjà expiré : elle y ajoute le jeton en query.
       */
      redirectTo: new URL("/reset-password", window.location.origin).toString(),
    });

    setPending(false);

    if (result.error) {
      setError(
        result.error.status === 429
          ? "Trop de demandes. Réessayez dans quelques minutes."
          : "L’envoi a échoué. Réessayez dans un instant.",
      );
      return;
    }

    setSent(true);
  }

  /**
   * Le message de confirmation ne dit **pas** si l'adresse est connue. L'API
   * répond identiquement dans les deux cas, et l'annoncer côté web
   * transformerait ce formulaire en outil d'énumération de comptes.
   */
  if (sent) {
    return (
      <div className="space-y-4">
        <FormSuccess>
          Si un compte existe pour {email}, un lien de réinitialisation vient d’y être envoyé.
        </FormSuccess>
        <p className="text-sm text-ink-muted">
          Le lien est valable une heure. Pensez à regarder dans les indésirables.
        </p>
        <Link href="/login" className="inline-block text-sm underline underline-offset-4">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Adresse e-mail"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {error && <FormError>{error}</FormError>}

        <SubmitButton pending={pending}>Envoyer le lien</SubmitButton>
      </form>

      <p className="text-center text-sm text-ink-muted">
        <Link href="/login" className="underline underline-offset-4">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
