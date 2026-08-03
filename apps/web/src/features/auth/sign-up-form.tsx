"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { FormAlert, FormSeparator, PasswordField, SubmitButton, TextField } from "./form-parts";
import { safeNextPath } from "./next-path";
import { SocialButtons } from "./social-buttons";
import {
  MIN_PASSWORD_LENGTH,
  type ValidationKey,
  validateEmail,
  validateIfFilled,
  validateName,
  validatePassword,
} from "./validation";
import { signUp } from "@/lib/auth-client";

type FieldName = "name" | "email" | "password";

export function SignUpForm() {
  const errors = useTranslations("AuthValidation");

  /**
   * Traduit la clé rendue par les validateurs (D29). Elle est convertie **dès
   * qu'elle est produite** plutôt qu'à l'affichage : l'état des erreurs porte
   * aussi des messages venus du serveur, qui sont déjà des phrases.
   */
  function message(key: ValidationKey | null): string | undefined {
    return key ? errors(key, { min: MIN_PASSWORD_LENGTH }) : undefined;
  }

  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const destination = safeNextPath(searchParams.get("next"));

  function validate(field: FieldName, value: string) {
    if (field === "name") {
      return validateName(value);
    }

    if (field === "email") {
      return validateEmail(value);
    }

    return validatePassword(value, "new");
  }

  /**
   * Erreur posée au `blur`, levée à la frappe suivante. Un champ resté vide ne
   * dit rien : voir `validateIfFilled`.
   */
  function onFieldBlur(field: FieldName, value: string) {
    setFieldErrors((current) => ({
      ...current,
      [field]: message(validateIfFilled(value, (input) => validate(field, input))),
    }));
  }

  function clearFieldError(field: FieldName) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const { [field]: _removed, ...rest } = current;

      return rest;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: Partial<Record<FieldName, string>> = {
      name: message(validateName(name)),
      email: message(validateEmail(email)),
      password: message(validatePassword(password, "new")),
    };

    if (nextErrors.name || nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      setError(null);
      return;
    }

    setFieldErrors({});
    setError(null);
    setPending(true);

    const result = await signUp.email({
      email: email.trim(),
      password,
      name: name.trim(),
      /**
       * Destination du lien contenu dans l'e-mail de vérification. Elle doit
       * être absolue : c'est l'API qui redirige à la fin, un chemin relatif
       * atterrirait sur son origine à elle.
       */
      callbackURL: new URL("/dashboard?verified=1", window.location.origin).toString(),
    });

    if (result.error) {
      setPending(false);

      /*
        Le compte existant est signalé **sous le champ e-mail**, pas dans le
        bandeau : c'est le seul champ à corriger, et l'y rattacher évite de
        relire les trois. Le reste n'a pas de champ coupable et reste en haut.
      */
      if (result.error.status === 422 || result.error.code === "USER_ALREADY_EXISTS") {
        setFieldErrors({ email: "Un compte existe déjà avec cette adresse." });
        return;
      }

      setError(result.error.message ?? "La création du compte a échoué.");
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
    <div className="flex flex-col gap-5">
      {/* Fournisseurs en premier — même raison qu'à la connexion. */}
      <SocialButtons callbackPath={destination} />

      <FormSeparator>ou</FormSeparator>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nom"
          type="text"
          autoComplete="name"
          autoFocus
          placeholder="Entrez votre nom"
          value={name}
          error={fieldErrors.name}
          onChange={(event) => {
            setName(event.target.value);
            clearFieldError("name");
          }}
          onBlur={(event) => onFieldBlur("name", event.target.value)}
        />

        <TextField
          label="Adresse e-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Entrez votre e-mail"
          value={email}
          error={fieldErrors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError("email");
          }}
          onBlur={(event) => onFieldBlur("email", event.target.value)}
        />

        <PasswordField
          label="Mot de passe"
          autoComplete="new-password"
          placeholder="Entrez votre mot de passe"
          hint={`${MIN_PASSWORD_LENGTH} caractères minimum.`}
          value={password}
          error={fieldErrors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError("password");
          }}
          onBlur={(event) => onFieldBlur("password", event.target.value)}
        />

        {error && <FormAlert>{error}</FormAlert>}

        <SubmitButton pending={pending}>Créer le compte</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
