import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient, chargerSession } from "@/lib/auth";
import {
  AUTH_CONTROL,
  AuthCard,
  AuthLink,
  PASSWORD,
  PasswordInput,
  SubmitButton,
  useEnvoi,
} from "./auth-card";
import { messageAuth } from "./messages";

/**
 * Inscription par `signUp.email` : nom, e-mail, mot de passe saisi deux fois (la confirmation
 * ne vit que dans l'interface, Better Auth n'en reçoit qu'un). L'API n'accepte que les adresses
 * de `SIGNUP_ALLOWLIST` : c'est l'échec qu'on montre.
 */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const { submit, pending, erreur } = useEnvoi(
    async () => {
      const { error } = await authClient.signUp.email({ name: name.trim(), email, password });
      return error ? messageAuth("inscription", error.code, error.status ?? 0) : null;
    },
    async () => {
      // L'inscription ouvre la session : la relire, puis l'Accueil.
      await chargerSession();
      await router.invalidate();
      await router.navigate({ to: "/" });
    },
    "Cette adresse n'est pas invitée. Demandez l'accès à l'administrateur.",
  );
  const tooShort = password.length > 0 && password.length < PASSWORD.min;
  const mismatch = again.length > 0 && again !== password;
  const valid =
    name.trim() !== "" && email !== "" && password.length >= PASSWORD.min && again === password;
  return (
    <AuthCard
      title="Créer un compte"
      description="better-lift est ouvert sur invitation."
      error={erreur}
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
              className={AUTH_CONTROL}
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
              className={AUTH_CONTROL}
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
          <Field data-invalid={mismatch}>
            <FieldLabel htmlFor="again-password">Confirmer le mot de passe</FieldLabel>
            <PasswordInput
              id="again-password"
              autoComplete="new-password"
              required
              aria-invalid={mismatch}
              value={again}
              onChange={(e) => setAgain(e.target.value)}
            />
            {mismatch && <FieldDescription>Les deux saisies diffèrent.</FieldDescription>}
          </Field>
          <SubmitButton pending={pending} disabled={!valid} pendingLabel="Création…">
            Créer le compte
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
