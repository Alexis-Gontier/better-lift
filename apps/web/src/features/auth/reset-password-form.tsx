import { Link, useNavigate } from "@tanstack/react-router";
import { LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEtat } from "@/components/states/use-etat";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  AUTH_CONTROL,
  AuthCard,
  AuthLink,
  PASSWORD,
  PasswordInput,
  SubmitButton,
} from "./auth-card";

/**
 * Nouveau mot de passe par `resetPassword`, avec le jeton du lien. Le seul échec qui compte :
 * le lien a expiré ou a déjà servi (`?etat=erreur`). On le dit avant la saisie, pas après.
 */
export function ResetPasswordForm() {
  const navigate = useNavigate();
  // Tant que la page lit la maquette : nominal, sauf état forcé par l'URL.
  const state = useEtat() ?? "nominal";
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [pending, setPending] = useState(false);
  const tooShort = next.length > 0 && next.length < PASSWORD.min;
  const mismatch = again.length > 0 && again !== next;
  const valid = next.length >= PASSWORD.min && again === next;

  if (state === "erreur") {
    return (
      <AuthCard
        title="Lien expiré"
        description="Ce lien a expiré ou a déjà servi. Le suivant restera valable une heure."
        footer={<AuthLink to="/login">Retour à la connexion</AuthLink>}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <LinkIcon className="size-5 text-muted-foreground" />
          </span>
          <Button asChild className={`${AUTH_CONTROL} w-full`}>
            <Link to="/forgot-password">Demander un nouveau lien</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    window.setTimeout(() => {
      toast.success("Mot de passe changé. Connectez-vous.");
      navigate({ to: "/login" });
    }, 700);
  };

  return (
    <AuthCard
      title="Nouveau mot de passe"
      description={`De ${PASSWORD.min} à ${PASSWORD.max} caractères. Vos autres appareils seront déconnectés.`}
      footer={<AuthLink to="/login">Retour à la connexion</AuthLink>}
    >
      <form onSubmit={submit}>
        <FieldGroup>
          <Field data-invalid={tooShort}>
            <FieldLabel htmlFor="new-password">Nouveau mot de passe</FieldLabel>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              autoFocus
              aria-invalid={tooShort}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            {tooShort && <FieldDescription>Au moins {PASSWORD.min} caractères.</FieldDescription>}
          </Field>
          <Field data-invalid={mismatch}>
            <FieldLabel htmlFor="again-password">Confirmer</FieldLabel>
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
          <SubmitButton
            pending={pending || state === "chargement"}
            disabled={!valid}
            pendingLabel="Enregistrement…"
          >
            Changer le mot de passe
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
