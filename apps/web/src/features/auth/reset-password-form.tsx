"use client";

import { CircleCheckIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@better-lift/ui/components/button";

import { FormAlert, PasswordField, SubmitButton } from "./form-parts";
import {
  MIN_PASSWORD_LENGTH,
  type ValidationKey,
  validateConfirmation,
  validateIfFilled,
  validatePassword,
} from "./validation";
import { resetPassword } from "@/lib/auth-client";

/**
 * Lien mort ou expiré. L'API a déjà tranché avant qu'on arrive ici : elle
 * valide le jeton puis redirige, avec `?token=` si tout va bien et
 * `?error=INVALID_TOKEN` sinon. On n'affiche donc jamais un formulaire dont on
 * sait déjà qu'il échouera.
 */
function ExpiredLink() {
  return (
    <div className="flex flex-col gap-4">
      <FormAlert>Ce lien de réinitialisation est expiré ou a déjà été utilisé.</FormAlert>

      <p className="text-sm text-muted-foreground">
        Les liens sont valables une heure. En demander un nouveau invalide le précédent.
      </p>

      <Button asChild size="lg" className="w-full">
        <Link href="/forgot-password">Demander un nouveau lien</Link>
      </Button>
    </div>
  );
}

/**
 * Le jeton arrive en prop plutôt que d'être relu ici : c'est ce qui permet à
 * `token` d'être un `string` franc. Le lire dans le composant obligerait à
 * composer avec un `string | null` que le garde ne suffit pas à affiner, les
 * déclarations de fonction étant hissées avant lui.
 */
function ResetPasswordFields({ token }: { token: string }) {
  const errors = useTranslations("AuthValidation");

  /**
   * Traduit la clé rendue par les validateurs (D29). Elle est convertie **dès
   * qu'elle est produite** plutôt qu'à l'affichage : l'état des erreurs porte
   * aussi des messages venus du serveur, qui sont déjà des phrases.
   */
  function message(key: ValidationKey | null): string | undefined {
    return key ? errors(key, { min: MIN_PASSWORD_LENGTH }) : undefined;
  }

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmation?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors = {
      password: message(validatePassword(password, "new")),
      confirmation: message(validateConfirmation(password, confirmation)),
    };

    if (nextErrors.password || nextErrors.confirmation) {
      setFieldErrors(nextErrors);
      setError(null);
      return;
    }

    setFieldErrors({});
    setError(null);
    setPending(true);

    const result = await resetPassword({ newPassword: password, token });

    setPending(false);

    if (result.error) {
      setError(
        result.error.code === "INVALID_TOKEN"
          ? "Ce lien est expiré ou a déjà été utilisé."
          : (result.error.message ?? "La réinitialisation a échoué."),
      );
      return;
    }

    setDone(true);
  }

  /**
   * Better Auth invalide les sessions existantes à la réinitialisation : on
   * renvoie donc vers la connexion, pas vers le tableau de bord.
   *
   * Un `<Link>` et non un `router.push` : c'est une navigation, elle doit
   * s'ouvrir dans un onglet au clic du milieu et afficher sa cible au survol.
   */
  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 px-4 py-6 text-center"
        >
          <CircleCheckIcon aria-hidden="true" className="size-6 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Mot de passe modifié.</p>
            <p className="text-sm text-muted-foreground">
              Vos autres sessions ont été déconnectées.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <PasswordField
        label="Nouveau mot de passe"
        autoComplete="new-password"
        autoFocus
        placeholder="Entrez votre nouveau mot de passe"
        hint={`${MIN_PASSWORD_LENGTH} caractères minimum.`}
        value={password}
        error={fieldErrors.password}
        onChange={(event) => {
          setPassword(event.target.value);
          setFieldErrors({});
        }}
        onBlur={(event) =>
          setFieldErrors((current) => ({
            ...current,
            password:
              validateIfFilled(event.target.value, (value) => validatePassword(value, "new")) ??
              undefined,
          }))
        }
      />

      <PasswordField
        label="Confirmation"
        autoComplete="new-password"
        placeholder="Confirmez votre mot de passe"
        value={confirmation}
        error={fieldErrors.confirmation}
        onChange={(event) => {
          setConfirmation(event.target.value);
          setFieldErrors((current) => ({ ...current, confirmation: undefined }));
        }}
        /*
          La confirmation se vérifie au `blur` contre le premier champ. Le faire
          à la frappe afficherait « ne correspondent pas » dès le premier
          caractère, ce qui est vrai et parfaitement inutile.
        */
        onBlur={(event) =>
          setFieldErrors((current) => ({
            ...current,
            confirmation:
              validateIfFilled(event.target.value, (value) =>
                validateConfirmation(password, value),
              ) ?? undefined,
          }))
        }
      />

      {error && <FormAlert>{error}</FormAlert>}

      <SubmitButton pending={pending}>Enregistrer</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token || searchParams.get("error")) {
    return <ExpiredLink />;
  }

  return <ResetPasswordFields token={token} />;
}
