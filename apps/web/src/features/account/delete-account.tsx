"use client";

import { useQuery } from "@tanstack/react-query";
import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import { ApiClientError, useDeleteAccount } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";

import { SettingsSection } from "./settings-section";
import { PasswordField, TextField } from "@/features/auth/form-parts";
import { apiClient } from "@/lib/api";
import { listAccounts } from "@/lib/auth-client";

/** Ce qu'il faut écrire quand il n'y a pas de mot de passe à confirmer. */
const CONFIRMATION_WORD = "SUPPRIMER";

/**
 * Le compte porte-t-il un mot de passe à confirmer ?
 *
 * L'API tranche pour de bon — elle interroge la base —, mais l'écran doit le
 * savoir **avant** l'envoi : afficher un champ de mot de passe à un compte créé
 * par GitHub seul lui demanderait quelque chose qu'il n'a jamais choisi.
 *
 * En cas d'échec de la lecture, on suppose qu'il y en a un : demander un mot de
 * passe à tort est rattrapable — l'API accepte le corps vide et l'utilisateur
 * bascule sur le mot à écrire —, ne pas le demander alors qu'il en faut un
 * conduit à un envoi refusé sans que rien ne l'ait annoncé.
 */
function useHasPassword() {
  return useQuery({
    queryKey: ["auth", "accounts"],
    queryFn: async () => {
      // Le SDK Better Auth ne lève pas : il rend `{ data, error }` (D20).
      const { data, error } = await listAccounts();

      if (error) {
        throw new Error(error.message ?? "Moyens de connexion illisibles.");
      }

      return data.some((account) => account.providerId === "credential");
    },
  });
}

/**
 * Suppression de compte (doc 04, § Compte — D18).
 *
 * **Deux temps, pas un.** Le bouton n'agit pas : il ouvre la confirmation. Le
 * geste accidentel est le seul risque réel sur un écran de réglages, et c'est
 * exactement celui qu'un second geste volontaire écarte.
 *
 * Ce qui fait preuve dépend de ce que le compte possède. Avec un mot de passe,
 * c'est lui — comme pour le changer, une session ouverte ne suffit pas. Sans
 * mot de passe (compte GitHub seul, D26), il n'y a rien à vérifier côté API :
 * c'est la fraîcheur de la session qui confirme, et l'écran demande alors
 * d'écrire un mot. Cette dernière n'est pas de la sécurité — elle est
 * contournable en deux secondes — mais du **temps de réflexion**, ce qui est
 * précisément ce qui manque à un clic de trop.
 */
export function DeleteAccountSection() {
  const hasPassword = useHasPassword();
  const remove = useDeleteAccount(apiClient);

  const [armed, setArmed] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  // Voir `useHasPassword` : l'inconnu se comporte comme « oui ».
  const needsPassword = hasPassword.data !== false;

  const disarm = () => {
    setArmed(false);
    setPassword("");
    setConfirmation("");
    setFieldError(null);
    setBanner(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (needsPassword && !password) {
      setFieldError("Le mot de passe est requis.");
      return;
    }

    if (!needsPassword && confirmation.trim() !== CONFIRMATION_WORD) {
      setFieldError(`Écrivez ${CONFIRMATION_WORD} pour confirmer.`);
      return;
    }

    setFieldError(null);
    setBanner(null);

    remove.mutate(needsPassword ? { password } : {}, {
      onSuccess: () => {
        /*
            Rechargement complet, jamais `router.push` : la session vient de
            disparaître, et une navigation cliente garderait monté le shell de
            l'application — sidebar, `GET /v1/me` — qui repartirait aussitôt en
            401. Le cache TanStack est déjà vidé par le hook.
          */
        window.location.assign("/login?deleted=1");
      },
      onError: (error) => {
        if (error instanceof ApiClientError && error.status === 422) {
          setFieldError(
            error.details?.find((detail) => detail.path === "password")?.message ??
              "Mot de passe incorrect.",
          );
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          setBanner(
            "Votre session est trop ancienne pour confirmer une suppression. Reconnectez-vous, puis recommencez.",
          );
          return;
        }

        setBanner("La suppression n’a pas abouti. Réessayez dans un instant.");
      },
    });
  };

  if (hasPassword.isPending) {
    return (
      <SettingsSection title="Supprimer mon compte">
        <Skeleton className="h-10 w-64 max-w-full" />
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Supprimer mon compte"
      description="La suppression est immédiate et définitive. Exportez vos données avant, si vous voulez les garder."
    >
      {/*
        L'avertissement est **toujours visible**, pas seulement une fois la
        confirmation ouverte : ce qui disparaît doit être lisible avant de
        cliquer, pas après.
      */}
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Il n’y a pas de corbeille.</AlertTitle>
        <AlertDescription>
          Vos séances, vos routines et leurs dossiers, vos records et vos exercices personnalisés
          sont effacés en même temps que le compte. Nos sauvegardes sont purgées sous trente jours.
        </AlertDescription>
      </Alert>

      {armed ? (
        <form noValidate onSubmit={submit} className="mt-6 flex max-w-md flex-col gap-6">
          {needsPassword ? (
            <PasswordField
              label="Votre mot de passe"
              autoComplete="current-password"
              autoFocus
              hint="Il confirme que c’est bien vous."
              value={password}
              error={fieldError}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldError(null);
              }}
            />
          ) : (
            <TextField
              label={`Écrivez ${CONFIRMATION_WORD} pour confirmer`}
              autoComplete="off"
              autoCapitalize="characters"
              autoFocus
              hint="Votre compte n’a pas de mot de passe : vous vous connectez avec GitHub."
              value={confirmation}
              error={fieldError}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setFieldError(null);
              }}
            />
          )}

          {banner && (
            <Alert variant="destructive">
              <AlertDescription>{banner}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="destructive"
              disabled={remove.isPending}
              aria-busy={remove.isPending}
            >
              {remove.isPending && <Spinner data-icon="inline-start" />}
              Supprimer définitivement mon compte
            </Button>

            <Button type="button" variant="ghost" onClick={disarm} disabled={remove.isPending}>
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-6">
          <Button type="button" variant="outline" onClick={() => setArmed(true)}>
            Supprimer mon compte
          </Button>
        </div>
      )}
    </SettingsSection>
  );
}
