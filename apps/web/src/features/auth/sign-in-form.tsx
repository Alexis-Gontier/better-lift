"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Field, FormError, Separator, SubmitButton } from "./form-parts";
import { safeNextPath } from "./next-path";
import { SocialButtons } from "./social-buttons";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Posé par `proxy.ts` quand il intercepte une page protégée. Toujours filtré :
  // il vient de l'URL, donc de l'extérieur.
  const destination = safeNextPath(searchParams.get("next"));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn.email({ email, password });

    if (result.error) {
      setPending(false);
      setError(
        result.error.status === 429
          ? "Trop de tentatives. Réessayez dans quelques minutes."
          : "Adresse e-mail ou mot de passe incorrect.",
      );
      return;
    }

    // `pending` n'est pas relâché : la navigation qui suit démonte le
    // formulaire, et le repasser à `false` ferait clignoter le bouton.
    router.push(destination);
    router.refresh();
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

        <div className="space-y-1.5">
          <Field
            label="Mot de passe"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Link
            href="/forgot-password"
            className="block text-right text-xs text-ink-muted underline underline-offset-4"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {error && <FormError>{error}</FormError>}

        <SubmitButton pending={pending}>Se connecter</SubmitButton>
      </form>

      <Separator>ou</Separator>

      <SocialButtons callbackPath={destination} />

      <p className="text-center text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
