import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  AuthCard,
  AuthLink,
  PASSWORD,
  PasswordInput,
  SubmitButton,
  useFakeSubmit,
} from "./auth-card";

/**
 * Inscription par `signUp.email` : nom, e-mail, mot de passe. L'API n'accepte que les adresses
 * de `SIGNUP_ALLOWLIST` : c'est l'échec qu'on montre.
 */
export function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { submit, pending, failed } = useFakeSubmit(() => navigate({ to: "/" }));
  const tooShort = password.length > 0 && password.length < PASSWORD.min;
  return (
    <AuthCard
      title="Créer un compte"
      description="better-lift est ouvert sur invitation."
      error={
        failed ? "Cette adresse n'est pas invitée. Demandez l'accès à l'administrateur." : null
      }
      footer={
        <>
          Déjà un compte ? <AuthLink to="/login">Se connecter</AuthLink>
        </>
      }
    >
      <form onSubmit={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nom</FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              maxLength={100}
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field data-invalid={tooShort}>
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              minLength={PASSWORD.min}
              required
              aria-invalid={tooShort}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FieldDescription>Au moins {PASSWORD.min} caractères.</FieldDescription>
          </Field>
          <SubmitButton pending={pending} disabled={tooShort} pendingLabel="Création…">
            Créer le compte
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
