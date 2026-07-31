"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Field, FormError, Separator, SubmitButton } from "./form-parts";
import { safeNextPath } from "./next-path";
import { SocialButtons } from "./social-buttons";
import { signUp } from "@/lib/auth-client";

/** Aligné sur `minPasswordLength` de l'instance Better Auth. */
const MIN_PASSWORD_LENGTH = 8;

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const destination = safeNextPath(searchParams.get("next"));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result = await signUp.email({
      email,
      password,
      name,
      /**
       * Destination du lien contenu dans l'e-mail de vérification. Elle doit
       * être absolue : c'est l'API qui redirige à la fin, un chemin relatif
       * atterrirait sur son origine à elle.
       */
      callbackURL: new URL("/dashboard?verified=1", window.location.origin).toString(),
    });

    if (result.error) {
      setPending(false);
      setError(
        result.error.status === 422 || result.error.code === "USER_ALREADY_EXISTS"
          ? "Un compte existe déjà avec cette adresse."
          : (result.error.message ?? "La création du compte a échoué."),
      );
      return;
    }

    /**
     * L'inscription ouvre directement la session : la vérification d'e-mail est
     * non bloquante (doc 09 D6). L'e-mail est parti, il n'est pas attendu.
     */
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Nom"
          type="text"
          required
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <Field
          label="Adresse e-mail"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Field
          label="Mot de passe"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          hint={`${MIN_PASSWORD_LENGTH} caractères minimum.`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && <FormError>{error}</FormError>}

        <SubmitButton pending={pending}>Créer le compte</SubmitButton>
      </form>

      <Separator>ou</Separator>

      <SocialButtons callbackPath={destination} />

      <p className="text-center text-sm text-ink-muted">
        Déjà inscrit ?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
