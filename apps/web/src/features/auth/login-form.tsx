import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  AUTH_CONTROL,
  AuthCard,
  AuthLink,
  PasswordInput,
  SubmitButton,
  useFakeSubmit,
} from "./auth-card";

/**
 * Connexion par `signIn.email`. Better Auth ne dit pas lequel des deux est faux : le message
 * non plus. La limite de tentatives (table `rateLimit`) rend le même échec.
 */
export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { submit, pending, failed } = useFakeSubmit(() => navigate({ to: "/" }));
  return (
    <AuthCard
      title="Connexion"
      description="Entrez votre e-mail et votre mot de passe."
      error={failed ? "E-mail ou mot de passe incorrect." : null}
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
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <span className="ml-auto">
                <AuthLink to="/forgot-password" quiet>
                  Mot de passe oublié ?
                </AuthLink>
              </span>
            </div>
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
