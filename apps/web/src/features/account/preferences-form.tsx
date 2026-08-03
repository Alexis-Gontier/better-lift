"use client";

import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useMe, useUpdateMe } from "@better-lift/api-client";
import { Button } from "@better-lift/ui/components/button";
import { Field, FieldDescription, FieldLabel } from "@better-lift/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@better-lift/ui/components/select";
import { Spinner } from "@better-lift/ui/components/spinner";
import {
  type CurrentUser,
  type Locale,
  type UnitSystem,
  type UpdateMeInput,
  type Visibility,
} from "@better-lift/validators";

import { ProfileError, SettingsSkeleton } from "./profile-state";
import { restOptions } from "./rest-options";
import { SettingsSection } from "./settings-section";
import { FormAlert } from "@/features/auth/form-parts";
import { apiClient } from "@/lib/api";

const UNIT_LABELS: Record<UnitSystem, string> = {
  METRIC: "Métrique — kg, m",
  IMPERIAL: "Impérial — lb, mi",
};

const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/**
 * `FOLLOWERS` est proposé alors que les abonnements n'existent pas : la colonne
 * les prévoit (D15) et le mobile peut déjà écrire la valeur. La masquer ici
 * ferait croire qu'elle n'existe pas, puis afficherait un menu vide le jour où
 * un profil la porte.
 */
const VISIBILITY_LABELS: Record<Visibility, string> = {
  PRIVATE: "Privé — vous seul",
  FOLLOWERS: "Abonnés — quand les abonnements existeront",
  PUBLIC: "Public — visible de tous",
};

const THEMES = [
  { value: "system", label: "Système", icon: MonitorIcon },
  { value: "light", label: "Clair", icon: SunIcon },
  { value: "dark", label: "Sombre", icon: MoonIcon },
] as const;

/** Champs de `PATCH /v1/me` que cet écran pilote. */
type Draft = Pick<
  CurrentUser,
  "unitSystem" | "locale" | "timezone" | "defaultRestSec" | "defaultVisibility"
>;

function toDraft(user: CurrentUser): Draft {
  return {
    unitSystem: user.unitSystem,
    locale: user.locale,
    timezone: user.timezone,
    defaultRestSec: user.defaultRestSec,
    defaultVisibility: user.defaultVisibility,
  };
}

/**
 * N'envoie que ce qui a bougé.
 *
 * `updateMeSchema` est `.strict()` et refuse un corps vide ; surtout, envoyer
 * l'intégralité du profil à chaque enregistrement écraserait un champ modifié
 * entre-temps depuis le mobile par une valeur lue avant sa modification.
 */
function changedFields(initial: Draft, draft: Draft): UpdateMeInput {
  const patch: Record<string, unknown> = {};

  for (const key of Object.keys(draft) as (keyof Draft)[]) {
    if (draft[key] !== initial[key]) {
      patch[key] = draft[key];
    }
  }

  return patch as UpdateMeInput;
}

/**
 * Préférences d'affichage et de séance (doc 05, § Réglages).
 *
 * Enregistrement **explicite** et non à chaque changement : trois des cinq
 * réglages transforment l'interface entière — changer d'unité pendant qu'on
 * compare deux valeurs est déroutant si ça se produit sans qu'on l'ait demandé.
 * Le bouton reste désactivé tant que rien n'a bougé, ce qui répond à la
 * question « est-ce que j'ai enregistré ? » sans avoir à la poser.
 *
 * Le thème fait exception : il est **hors profil**, stocké par `next-themes`
 * dans le navigateur, et s'applique donc immédiatement. C'est aussi le seul
 * réglage qu'on juge en le regardant.
 */
export function PreferencesForm() {
  const me = useMe(apiClient);
  const update = useUpdateMe(apiClient);
  const { theme, setTheme } = useTheme();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);

  /*
    Le thème n'est pas connu au rendu serveur — il vient de `localStorage` ou du
    média. Même précaution que dans le menu du compte : on n'affiche l'état
    sélectionné qu'une fois monté, sinon il est faux la moitié du temps.
  */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initial = me.data ? toDraft(me.data) : null;
  const current = draft ?? initial;

  if (me.isPending) {
    return <SettingsSkeleton blocks={2} />;
  }

  // Distinct du chargement, et pas un squelette : une session expirée en cours
  // de consultation laisserait sinon l'écran en attente pour toujours.
  if (!current || !initial) {
    return <ProfileError query={me} />;
  }

  const patch = changedFields(initial, current);
  const dirty = Object.keys(patch).length > 0;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setSaved(false);
    setDraft({ ...current, [key]: value });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!dirty) {
      return;
    }

    update.mutate(patch, {
      onSuccess: () => {
        // Le cache de `me` porte désormais la réponse du serveur : abandonner
        // le brouillon fait repartir le formulaire de la vérité enregistrée.
        setDraft(null);
        setSaved(true);
      },
    });
  };

  const deviceTimeZone = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;
  const timeZoneDiffers = deviceTimeZone !== null && deviceTimeZone !== current.timezone;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <SettingsSection
        title="Affichage"
        description="Ces réglages ne changent que ce que vous voyez : les données restent enregistrées en unités métriques."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="pref-units">Unités</FieldLabel>
            <Select
              value={current.unitSystem}
              onValueChange={(value) => set("unitSystem", value as UnitSystem)}
            >
              <SelectTrigger id="pref-units" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(UNIT_LABELS) as UnitSystem[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {UNIT_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Les charges sont converties à l’affichage, jamais dans vos données.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="pref-locale">Langue</FieldLabel>
            <Select
              value={current.locale}
              onValueChange={(value) => set("locale", value as Locale)}
            >
              <SelectTrigger id="pref-locale" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LOCALE_LABELS) as Locale[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {LOCALE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Sert aussi à choisir la langue des noms d’exercices servis par l’API.
            </FieldDescription>
          </Field>

          {/*
            Pas de menu des 400 fuseaux IANA : il demanderait une recherche, donc
            deux primitives de plus pour un champ qu'on règle une fois. Le cas
            réel est « mon fuseau est faux parce que je me suis inscrit en
            voyage », et le comparer à celui de l'appareil le couvre.
          */}
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="pref-timezone">Fuseau horaire</FieldLabel>
            <div className="flex flex-wrap items-center gap-3">
              <output
                id="pref-timezone"
                className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm"
              >
                {current.timezone}
              </output>
              {timeZoneDiffers && deviceTimeZone && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("timezone", deviceTimeZone)}
                >
                  Utiliser celui de cet appareil ({deviceTimeZone})
                </Button>
              )}
            </div>
            <FieldDescription>
              Détermine le jour auquel appartient une séance. Une séance du samedi soir doit rester
              au samedi, même consultée depuis un autre continent.
            </FieldDescription>
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Séance"
        description="Les valeurs proposées par défaut quand vous démarrez une séance."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="pref-rest">Repos par défaut</FieldLabel>
            <Select
              value={String(current.defaultRestSec)}
              onValueChange={(value) => set("defaultRestSec", Number(value))}
            >
              <SelectTrigger id="pref-rest" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {restOptions(current.defaultRestSec, current.locale).map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Chaque exercice d’une routine peut le remplacer.</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="pref-visibility">Visibilité des séances</FieldLabel>
            <Select
              value={current.defaultVisibility}
              onValueChange={(value) => set("defaultVisibility", value as Visibility)}
            >
              <SelectTrigger id="pref-visibility" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {VISIBILITY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Aucun partage n’existe encore : tout reste privé quoi que vous choisissiez.
            </FieldDescription>
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Thème"
        description="Réglage de cet appareil, appliqué immédiatement — il ne suit pas votre compte."
      >
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Thème de l’interface</legend>

          {THEMES.map(({ value, label, icon: Icon }) => {
            const active = mounted && (theme ?? "system") === value;

            return (
              <Button
                key={value}
                type="button"
                variant={active ? "secondary" : "outline"}
                aria-pressed={mounted ? active : undefined}
                onClick={() => setTheme(value)}
              >
                <Icon data-icon="inline-start" />
                {label}
                {active && <CheckIcon className="ml-1 size-4" />}
              </Button>
            );
          })}
        </fieldset>
      </SettingsSection>

      {/*
        La barre d'enregistrement est **hors des sections**, en bas du
        formulaire : un seul envoi couvre l'affichage et la séance, et la loger
        dans le pied d'une carte laisserait croire qu'elle n'enregistre que
        celle-là. Le thème, lui, n'est pas concerné — il s'applique tout seul.

        `sticky` : sur un écran court, les réglages de séance sont sous la ligne
        de flottaison et le bouton disparaîtrait au moment où on l'a modifié.
      */}
      <div className="sticky bottom-0 z-10 rounded-xl border border-border bg-background/85 px-4 py-3 backdrop-blur">
        <SaveRow
          dirty={dirty}
          saved={saved}
          pending={update.isPending}
          error={update.isError ? update.error.message : null}
          onReset={() => {
            setDraft(null);
            setSaved(false);
          }}
        />
      </div>
    </form>
  );
}

/**
 * Barre d'enregistrement.
 *
 * « Enregistré » est annoncé dans une région `status` : sans elle, la seule
 * confirmation serait visuelle et personne n'entendrait que l'écriture a
 * abouti. Elle disparaît au premier changement suivant.
 */
function SaveRow({
  dirty,
  saved,
  pending,
  error,
  onReset,
}: {
  dirty: boolean;
  saved: boolean;
  pending: boolean;
  error: string | null;
  onReset: () => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {error && <FormAlert>{error}</FormAlert>}
        {!error && (
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {saved ? "Préférences enregistrées." : dirty ? "Modifications non enregistrées." : ""}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {dirty && (
          <Button type="button" variant="ghost" onClick={onReset} disabled={pending}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={!dirty || pending} aria-busy={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
