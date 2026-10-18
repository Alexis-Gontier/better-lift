import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthCard, AuthLink, SubmitButton, useFakeSubmit } from "./auth-card";

/**
 * Mot de passe oublié par `requestPasswordReset`. Better Auth répond pareil que l'adresse ait
 * un compte ou non : l'écran envoyé ne le dit pas non plus.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { submit, pending, failed } = useFakeSubmit(() => setSent(true));

  if (sent) {
    return (
      <AuthCard
        title="Vérifiez vos e-mails"
        description={
          <>
            Si un compte existe pour <span className="font-medium text-foreground">{email}</span>,
            un lien pour choisir un nouveau mot de passe vient d'y être envoyé. Il expire dans une
            heure.
          </>
        }
        footer={<AuthLink to="/login">Retour à la connexion</AuthLink>}
      >
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-6 text-center">
          <MailCheck className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Rien reçu ? Regardez les indésirables.</p>
          <Button variant="outline" size="sm" onClick={() => toast.success("Lien renvoyé")}>
            Renvoyer le lien
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Entrez votre e-mail : vous recevrez un lien pour en choisir un nouveau."
      error={failed ? "L'envoi a échoué. Réessayez dans un instant." : null}
      footer={<AuthLink to="/login">Retour à la connexion</AuthLink>}
    >
      <form onSubmit={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
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
          <SubmitButton pending={pending} pendingLabel="Envoi…">
            Envoyer le lien
          </SubmitButton>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
