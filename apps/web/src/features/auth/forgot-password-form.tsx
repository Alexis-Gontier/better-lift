"use client";

import { ArrowLeftIcon, MailCheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@better-lift/ui/components/button";

import { FormAlert, SubmitButton, TextField } from "./form-parts";
import { validateEmail, validateIfFilled } from "./validation";
import { requestPasswordReset } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const invalid = validateEmail(email);

    if (invalid) {
      setEmailError(invalid);
      setError(null);
      return;
    }

    setEmailError(undefined);
    setError(null);
    setPending(true);

    const result = await requestPasswordReset({
      email: email.trim(),
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
   *
   * Il remplace le formulaire au lieu de s'y ajouter : le renvoyer en boucle
   * n'avancerait à rien, et laisser le bouton actif invite précisément à ça.
   */
  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 px-4 py-6 text-center"
        >
          <MailCheckIcon aria-hidden="true" className="size-6 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Si un compte existe pour{" "}
              <span className="break-all text-foreground">{email.trim()}</span>, un lien vient d’y
              être envoyé.
            </p>
            <p className="text-sm text-muted-foreground">
              Il est valable une heure. Pensez à regarder dans les indésirables.
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/login">
            <ArrowLeftIcon data-icon="inline-start" />
            Retour à la connexion
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Adresse e-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="Entrez votre e-mail"
          value={email}
          error={emailError}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
          }}
          onBlur={(event) =>
            setEmailError(validateIfFilled(event.target.value, validateEmail) ?? undefined)
          }
        />

        {error && <FormAlert>{error}</FormAlert>}

        <SubmitButton pending={pending}>Envoyer le lien</SubmitButton>
      </form>

      <p className="text-center text-sm">
        <Link
          href="/login"
          className="rounded-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
