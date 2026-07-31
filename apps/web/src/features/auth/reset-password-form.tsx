"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Field, FormError, FormSuccess, SubmitButton } from "./form-parts";
import { resetPassword } from "@/lib/auth-client";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Lien mort ou expiré. L'API a déjà tranché avant qu'on arrive ici : elle
 * valide le jeton puis redirige, avec `?token=` si tout va bien et
 * `?error=INVALID_TOKEN` sinon. On n'affiche donc jamais un formulaire dont on
 * sait déjà qu'il échouera.
 */
function ExpiredLink() {
  return (
    <div className="space-y-4">
      <FormError>Ce lien de réinitialisation est expiré ou a déjà été utilisé.</FormError>
      <p className="text-sm text-ink-muted">Les liens sont valables une heure.</p>
      <Link
        href="/forgot-password"
        className="inline-block rounded-lg bg-accent px-3 py-2 text-sm font-medium text-surface"
      >
        Demander un nouveau lien
      </Link>
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
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

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
   */
  if (done) {
    return (
      <div className="space-y-4">
        <FormSuccess>Mot de passe modifié.</FormSuccess>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full rounded-lg bg-accent px-3 py-2 font-medium text-surface"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Nouveau mot de passe"
        type="password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        autoFocus
        hint={`${MIN_PASSWORD_LENGTH} caractères minimum.`}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Field
        label="Confirmation"
        type="password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
      />

      {error && <FormError>{error}</FormError>}

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
