"use client";

import { CircleCheckIcon, MailIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Spinner } from "@better-lift/ui/components/spinner";

import { sendVerificationEmail, useSession } from "@/lib/auth-client";

/**
 * Le pendant visible de la vérification non bloquante (doc 09 D6).
 *
 * Puisque rien n'empêche d'utiliser l'application sans adresse confirmée, il
 * faut bien que quelque chose le rappelle — sinon la décision « non bloquante »
 * revient en pratique à « jamais vérifié ». D'où ce bandeau, présent tant que
 * l'adresse ne l'est pas, et qui n'interrompt rien.
 *
 * Variante `default` et non `destructive` : ce n'est pas une erreur, l'app
 * fonctionne. Un bandeau rouge sur le premier écran d'un inscrit dirait le
 * contraire.
 */
export function VerificationNotice() {
  const searchParams = useSearchParams();
  const session = useSession();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  // Le lien de l'e-mail revient sur `/dashboard?verified=1`.
  if (searchParams.get("verified")) {
    return (
      <Alert>
        <CircleCheckIcon className="text-primary" />
        <AlertTitle>Adresse e-mail confirmée.</AlertTitle>
      </Alert>
    );
  }

  const user = session.data?.user;

  if (!user || user.emailVerified) {
    return null;
  }

  async function resend(email: string) {
    setState("sending");

    const result = await sendVerificationEmail({
      email,
      callbackURL: new URL("/dashboard?verified=1", window.location.origin).toString(),
    });

    setState(result.error ? "failed" : "sent");
  }

  return (
    <Alert>
      <MailIcon />
      <AlertTitle>Adresse e-mail non confirmée</AlertTitle>
      <AlertDescription>
        Nous avons écrit à <span className="break-all text-foreground">{user.email}</span>.
        {state === "failed" && " Le renvoi a échoué."}
      </AlertDescription>

      <AlertAction>
        {state === "sent" ? (
          /*
            Le bouton disparaît une fois l'e-mail parti. Le laisser actif
            invite à recliquer, ce qui ne fait qu'empiler des e-mails
            identiques — et finit par déclencher la limite de débit.
          */
          <span role="status" className="text-sm text-muted-foreground">
            E-mail renvoyé.
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={state === "sending"}
            aria-busy={state === "sending"}
            onClick={() => void resend(user.email)}
          >
            {state === "sending" && <Spinner data-icon="inline-start" />}
            {state === "failed" ? "Réessayer" : "Renvoyer"}
          </Button>
        )}
      </AlertAction>
    </Alert>
  );
}
