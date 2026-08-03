"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@better-lift/ui/components/button";
import { Spinner } from "@better-lift/ui/components/spinner";

import { SettingsSection } from "./settings-section";
import { FormAlert, PasswordField } from "@/features/auth/form-parts";
import {
  MIN_PASSWORD_LENGTH,
  type ValidationKey,
  validateConfirmation,
  validatePassword,
} from "@/features/auth/validation";
import { changePassword } from "@/lib/auth-client";

type Fields = { current: string; next: string; confirmation: string };
type Errors = Partial<Record<keyof Fields, string | null>>;

const EMPTY: Fields = { current: "", next: "", confirmation: "" };

/**
 * Changement de mot de passe depuis les réglages.
 *
 * Distinct de la réinitialisation par e-mail : ici la session existe déjà, et
 * c'est l'ancien mot de passe qui fait preuve. Sans lui, un ordinateur laissé
 * déverrouillé suffirait à confisquer un compte.
 *
 * **Les autres sessions sont révoquées** à l'enregistrement. C'est le
 * comportement attendu de qui change son mot de passe parce qu'il le croit
 * compromis : le changer sans déconnecter l'intrus ne servirait à rien. La
 * session courante, elle, survit — se faire déconnecter de l'écran où l'on
 * vient d'agir passerait pour un échec.
 */
export function PasswordForm() {
  const t = useTranslations("AuthValidation");

  /**
   * Traduit la clé rendue par les validateurs (D29). Elle est convertie **dès
   * qu'elle est produite** plutôt qu'à l'affichage : l'état des erreurs porte
   * aussi des messages venus du serveur, qui sont déjà des phrases.
   */
  function message(key: ValidationKey | null): string | undefined {
    return key ? t(key, { min: MIN_PASSWORD_LENGTH }) : undefined;
  }

  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const change = (key: keyof Fields, value: string) => {
    setDone(false);
    setBanner(null);
    setFields((previous) => ({ ...previous, [key]: value }));

    if (errors[key]) {
      setErrors((previous) => ({ ...previous, [key]: null }));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const found: Errors = {
      current: message(validatePassword(fields.current, "existing")),
      next: message(validatePassword(fields.next, "new")),
      confirmation: message(validateConfirmation(fields.next, fields.confirmation)),
    };

    /**
     * Réutiliser le mot de passe courant n'est pas un changement. Better Auth
     * l'accepterait sans rien dire, et on repartirait convaincu d'avoir agi.
     */
    if (!found.next && fields.next === fields.current) {
      found.next = "Choisissez un mot de passe différent de l’actuel.";
    }

    setErrors(found);

    if (Object.values(found).some(Boolean)) {
      return;
    }

    setPending(true);
    setBanner(null);

    // Le SDK Better Auth **ne lève pas** : il rend `{ data, error }`. Un
    // `try/catch` seul laisserait passer les échecs en silence (D20).
    const { error } = await changePassword({
      currentPassword: fields.current,
      newPassword: fields.next,
      revokeOtherSessions: true,
    });

    setPending(false);

    if (error) {
      // Un mauvais mot de passe courant est la seule cause probable d'un 400
      // ou d'un 401 ici : on le dit sous le champ concerné plutôt qu'en haut.
      if (error.status === 400 || error.status === 401) {
        setErrors({ current: "Mot de passe actuel incorrect." });
        return;
      }

      setBanner(error.message ?? "Le changement n’a pas abouti. Réessayez.");
      return;
    }

    setFields(EMPTY);
    setDone(true);
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)}>
      <SettingsSection
        title="Mot de passe"
        description="Changer votre mot de passe déconnecte vos autres appareils. Celui-ci reste connecté."
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {banner && <FormAlert>{banner}</FormAlert>}
              {!banner && (
                <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                  {done ? "Mot de passe changé. Vos autres sessions ont été fermées." : ""}
                </p>
              )}
            </div>

            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              Changer le mot de passe
            </Button>
          </div>
        }
      >
        <div className="flex max-w-md flex-col gap-6">
          <PasswordField
            label="Mot de passe actuel"
            autoComplete="current-password"
            value={fields.current}
            error={errors.current}
            onChange={(event) => change("current", event.target.value)}
          />

          <PasswordField
            label="Nouveau mot de passe"
            autoComplete="new-password"
            hint="8 caractères minimum."
            value={fields.next}
            error={errors.next}
            onChange={(event) => change("next", event.target.value)}
          />

          <PasswordField
            label="Confirmer le nouveau mot de passe"
            autoComplete="new-password"
            value={fields.confirmation}
            error={errors.confirmation}
            onChange={(event) => change("confirmation", event.target.value)}
          />
        </div>
      </SettingsSection>
    </form>
  );
}
