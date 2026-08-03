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
  validatePassword,
} from "./validation";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("SignIn");
  const fields = useTranslations("AuthFields");
  const errors = useTranslations("AuthValidation");

  /**
   * Traduit la clé rendue par les validateurs (D29). Elle est convertie **dès
   * qu'elle est produite** plutôt qu'à l'affichage : l'état des erreurs porte
   * aussi des messages venus du serveur, qui sont déjà des phrases.
   */
  function message(key: ValidationKey | null): string | undefined {
    return key ? errors(key, { min: MIN_PASSWORD_LENGTH }) : undefined;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Posé par `proxy.ts` quand il intercepte une page protégée. Toujours filtré :
  // il vient de l'URL, donc de l'extérieur.
  const destination = safeNextPath(searchParams.get("next"));

  /**
   * Validation au `blur`, jamais à la frappe : signaler « adresse invalide »
   * dès le deuxième caractère revient à réprimander quelqu'un en train de bien
   * faire. Une fois l'erreur posée, en revanche, elle est levée à la frappe
   * suivante — la laisser sous un champ qu'on est en train de corriger est
   * l'autre moitié du même défaut.
   */
  function clearFieldError(field: "email" | "password") {
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

    /*
      Revalidation complète à l'envoi : le `blur` du dernier champ ne se produit
      pas quand le formulaire part à la touche Entrée.
    */
    const nextErrors = {
      email: message(validateEmail(email)),
      password: message(validatePassword(password, "existing")),
    };

    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      setError(null);
      return;
    }

    setFieldErrors({});
    setError(null);
    setPending(true);

    const result = await signIn.email({ email: email.trim(), password });

    if (result.error) {
      setPending(false);
      setError(result.error.status === 429 ? t("rateLimited") : t("invalidCredentials"));
      return;
    }

    // `pending` n'est pas relâché : la navigation qui suit démonte le
    // formulaire, et le repasser à `false` ferait clignoter le bouton.
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/*
        Les fournisseurs passent **avant** le formulaire. La majorité des gens
        cliquent un bouton social ; les reléguer dessous oblige tout le monde à
        parcourir des champs qu'une minorité remplira. L'e-mail reste juste en
        dessous, sans repli ni bascule — cacher une option pour en pousser une
        autre est le défaut inverse.
      */}
      <SocialButtons callbackPath={destination} />

      <FormSeparator>{fields("or")}</FormSeparator>

      {/*
        `noValidate` : la validation native affiche une bulle non stylable, dans
        la locale du navigateur, qui disparaît au premier clic et n'est pas lue
        par tous les lecteurs d'écran. On la remplace, on ne s'y ajoute pas —
        `type` et `autoComplete` restent utiles pour le clavier mobile et
        l'autofill.
      */}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label={fields("email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder={fields("emailPlaceholder")}
          value={email}
          /* La validation renvoie une clé (D29) : c'est l'écran qui choisit
             les mots, et lui seul connaît la langue affichée. */
          error={fieldErrors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError("email");
          }}
          onBlur={(event) =>
            setFieldErrors((current) => ({
              ...current,
              email: message(validateIfFilled(event.target.value, validateEmail)),
            }))
          }
        />

        <div className="flex flex-col gap-1.5">
          <PasswordField
            label={fields("password")}
            autoComplete="current-password"
            placeholder={fields("passwordPlaceholder")}
            value={password}
            error={fieldErrors.password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError("password");
            }}
          />

          <Link
            href="/forgot-password"
            className="self-end rounded-sm text-xs text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        {error && <FormAlert>{error}</FormAlert>}

        <SubmitButton pending={pending}>{t("submit")}</SubmitButton>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href="/signup"
          className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t("createAccount")}
        </Link>
      </p>
    </div>
  );
}
