"use client";

import { useState } from "react";

import { ApiClientError, useMe, useUpdateMe } from "@better-lift/api-client";
import { Button } from "@better-lift/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@better-lift/ui/components/field";
import { Spinner } from "@better-lift/ui/components/spinner";
import { Textarea } from "@better-lift/ui/components/textarea";
import { type CurrentUser, type UpdateMeInput } from "@better-lift/validators";

import { ProfileError, SettingsSkeleton } from "./profile-state";
import { SettingsSection } from "./settings-section";
import {
  emptyToNull,
  MAX_BIO_LENGTH,
  validateBio,
  validateDisplayName,
  validateUsername,
} from "./validation";
import { FormAlert, TextField } from "@/features/auth/form-parts";
import { apiClient } from "@/lib/api";

type Fields = { name: string; username: string; bio: string };
type Errors = Partial<Record<keyof Fields, string | null>>;

function toFields(user: CurrentUser): Fields {
  return {
    name: user.name,
    // L'API rend `null` pour un champ vide ; le formulaire, lui, ne manipule
    // que des chaînes — un `<input value={null}>` bascule en non contrôlé.
    username: user.username ?? "",
    bio: user.bio ?? "",
  };
}

const VALIDATORS: Record<keyof Fields, (value: string) => string | null> = {
  name: validateDisplayName,
  username: validateUsername,
  bio: validateBio,
};

/**
 * Identité affichée du compte (doc 05, § Réglages).
 *
 * La validation suit la règle des formulaires du projet : au `blur`, puis à
 * chaque frappe une fois l'erreur levée, et **rien sur un champ resté vide** —
 * le premier champ a le focus, donc un simple clic ailleurs déclencherait
 * sinon une erreur sur du vide. Tout est revalidé à l'envoi, parce que le
 * `blur` du dernier champ n'a pas lieu quand on soumet à la touche Entrée.
 */
export function ProfileForm() {
  const me = useMe(apiClient);
  const update = useUpdateMe(apiClient);

  const [fields, setFields] = useState<Fields | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  const initial = me.data ? toFields(me.data) : null;
  const current = fields ?? initial;

  if (me.isPending) {
    return <SettingsSkeleton height="h-96" />;
  }

  // Distinct du chargement, et pas un squelette : une session expirée en cours
  // de consultation laisserait sinon l'écran en attente pour toujours.
  if (!current || !initial) {
    return <ProfileError query={me} />;
  }

  const dirty = (Object.keys(current) as (keyof Fields)[]).some(
    (key) => current[key] !== initial[key],
  );

  const change = (key: keyof Fields, value: string) => {
    setSaved(false);
    setFields({ ...current, [key]: value });

    // Erreur déjà levée : on revalide à la frappe pour qu'elle disparaisse dès
    // que la saisie devient valide, sans attendre un nouveau `blur`.
    if (errors[key]) {
      setErrors((previous) => ({ ...previous, [key]: VALIDATORS[key](value) }));
    }
  };

  const blur = (key: keyof Fields) => {
    if (current[key].trim().length === 0 && initial[key].trim().length === 0) {
      return;
    }

    setErrors((previous) => ({ ...previous, [key]: VALIDATORS[key](current[key]) }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const found: Errors = {
      name: validateDisplayName(current.name),
      username: validateUsername(current.username),
      bio: validateBio(current.bio),
    };

    setErrors(found);

    if (Object.values(found).some(Boolean) || !dirty) {
      return;
    }

    /**
     * Seuls les champs modifiés partent. `username` et `bio` deviennent `null`
     * quand ils sont vidés : l'API distingue « absent » (ne pas toucher) de
     * `null` (effacer), et une chaîne vide ne dirait ni l'un ni l'autre.
     */
    const patch: UpdateMeInput = {
      ...(current.name.trim() !== initial.name ? { name: current.name.trim() } : {}),
      ...(current.username.trim() !== initial.username
        ? { username: emptyToNull(current.username) }
        : {}),
      ...(current.bio.trim() !== initial.bio ? { bio: emptyToNull(current.bio) } : {}),
    };

    update.mutate(patch, {
      onSuccess: () => {
        setFields(null);
        setSaved(true);
      },
      onError: (error) => {
        /**
         * 409 : le pseudo est pris. L'API le signale par un `details` sur le
         * champ, qu'on replace **sous l'entrée concernée** plutôt qu'en
         * bandeau — l'erreur porte sur un champ précis, la montrer ailleurs
         * obligerait à le deviner.
         */
        if (error instanceof ApiClientError && error.status === 409) {
          const detail = error.details?.find((entry) => entry.path === "username");
          setErrors((previous) => ({
            ...previous,
            username: detail?.message ?? "Ce pseudo est déjà pris.",
          }));
        }
      },
    });
  };

  // Le bandeau ne parle que de ce qu'aucun champ ne porte : un 409 est déjà
  // affiché sous le pseudo, le répéter en haut le ferait lire deux fois.
  const bannerError =
    update.isError && !(update.error instanceof ApiClientError && update.error.status === 409)
      ? update.error.message
      : null;

  return (
    <form noValidate onSubmit={submit}>
      <SettingsSection
        title="Identité"
        description="Ce que les autres verront de vous le jour où les profils publics existeront."
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {bannerError && <FormAlert>{bannerError}</FormAlert>}
              {!bannerError && (
                <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                  {saved ? "Profil enregistré." : dirty ? "Modifications non enregistrées." : ""}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {dirty && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={update.isPending}
                  onClick={() => {
                    setFields(null);
                    setErrors({});
                    setSaved(false);
                  }}
                >
                  Annuler
                </Button>
              )}
              <Button
                type="submit"
                disabled={!dirty || update.isPending}
                aria-busy={update.isPending}
              >
                {update.isPending && <Spinner data-icon="inline-start" />}
                Enregistrer
              </Button>
            </div>
          </div>
        }
      >
        <div className="flex max-w-xl flex-col gap-6">
          <TextField
            label="Nom"
            autoComplete="name"
            value={current.name}
            error={errors.name}
            onChange={(event) => change("name", event.target.value)}
            onBlur={() => blur("name")}
          />

          <TextField
            label="Pseudo"
            autoComplete="username"
            placeholder="facultatif"
            hint="Minuscules, chiffres, tiret et tiret bas. Il servira d’adresse à votre profil."
            value={current.username}
            error={errors.username}
            onChange={(event) => change("username", event.target.value)}
            onBlur={() => blur("username")}
          />

          <BioField
            value={current.bio}
            error={errors.bio}
            onChange={(value) => change("bio", value)}
            onBlur={() => blur("bio")}
          />
        </div>
      </SettingsSection>
    </form>
  );
}

/**
 * `TextField` rend un `<input>` : la bio a besoin de plusieurs lignes et d'un
 * compteur, d'où ce champ écrit à part plutôt qu'une option de plus sur le
 * composant partagé.
 */
function BioField({
  value,
  error,
  onChange,
  onBlur,
}: {
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const remaining = MAX_BIO_LENGTH - value.trim().length;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>

      <Textarea
        id="profile-bio"
        rows={4}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "profile-bio-error" : "profile-bio-hint"}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />

      {error && <FieldError id="profile-bio-error">{error}</FieldError>}

      {/*
        Le compteur est annoncé poliment et **seulement quand il approche de la
        limite** : une région vivante qui répète un nombre à chaque frappe rend
        la saisie inutilisable au lecteur d'écran.
      */}
      <FieldDescription id="profile-bio-hint">
        <span aria-live={remaining <= 20 ? "polite" : "off"}>
          {remaining >= 0
            ? `${remaining} caractère${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}.`
            : `${-remaining} caractère${-remaining > 1 ? "s" : ""} de trop.`}
        </span>
      </FieldDescription>
    </Field>
  );
}
