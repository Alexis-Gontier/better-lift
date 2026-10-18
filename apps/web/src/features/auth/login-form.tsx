import { useRouter, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient, chargerSession, cibleApresConnexion } from "@/lib/auth";
import {
  AUTH_CONTROL,
  AuthCard,
  AuthLink,
  PasswordInput,
  SubmitButton,
  useEnvoi,
} from "./auth-card";
import { messageAuth } from "./messages";

/**
 * Connexion par `signIn.email`. Better Auth ne dit pas lequel des deux est faux : le message
 * non plus. La limite de tentatives (table `rateLimit`) rend le même échec.
 */
export function LoginForm() {
  const router = useRouter();
  const { redirect } = useSearch({ from: "/_auth/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { submit, pending, erreur } = useEnvoi(
    async () => {
      const { error } = await authClient.signIn.email({ email, password });
      return error ? messageAuth("connexion", error.code, error.status ?? 0) : null;
    },
    async () => {
      // Relire puis invalider : la garde de `_app` doit voir la nouvelle session.
      await chargerSession();
      await router.invalidate();
      await router.navigate({ to: cibleApresConnexion(redirect) });
    },
    "E-mail ou mot de passe incorrect.",
  );
  return (
    <AuthCard
      title="Connexion"
      description="Entrez votre e-mail et votre mot de passe."
      error={erreur}
      footer={
        <>
          Pas encore de compte ? <AuthLink to="/register">Créer un compte</AuthLink>
        </>
      }
    >
      <form onSubmit={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              className={AUTH_CONTROL}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            {/* Pas de « Mot de passe oublié ? » : l'API n'envoie aucun e-mail (D294). */}
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <SubmitButton
            pending={pending}
            disabled={email === "" || password === ""}
            pendingLabel="Connexion…"
          >
            Se connecter
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
