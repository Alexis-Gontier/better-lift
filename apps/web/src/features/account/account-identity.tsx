"use client";

import { CircleCheckIcon, MailIcon } from "lucide-react";
import { useState } from "react";

import { useMe } from "@better-lift/api-client";
import { Badge } from "@better-lift/ui/components/badge";
import { Button } from "@better-lift/ui/components/button";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";

import { SettingsSection } from "./settings-section";
import { apiClient } from "@/lib/api";
import { sendVerificationEmail } from "@/lib/auth-client";

/**
 * Identifiants du compte : l'adresse et son état de vérification.
 *
 * L'adresse est en **lecture seule**. La changer demande de vérifier la
 * nouvelle avant de basculer, sans quoi une faute de frappe enferme dehors —
 * c'est un parcours à part entière, pas un champ de formulaire, et il n'est
 * pas au périmètre de la V1.
 */
export function AccountIdentity() {
  const me = useMe(apiClient);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  if (me.isPending) {
    return (
      <SettingsSection title="Adresse e-mail">
        <Skeleton className="h-10 w-72 max-w-full" />
      </SettingsSection>
    );
  }

  const user = me.data;

  if (!user) {
    return null;
  }

  const resend = async () => {
    setState("sending");

    // Le SDK Better Auth ne lève pas : il rend `{ error }` (D20).
    const { error } = await sendVerificationEmail({
      email: user.email,
      callbackURL: "/dashboard?verified=1",
    });

    setState(error ? "failed" : "sent");
  };

  return (
    <SettingsSection
      title="Adresse e-mail"
      description="Elle sert à vous connecter et à récupérer votre compte. La modifier n’est pas encore possible."
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium">{user.email}</span>

        {user.emailVerified ? (
          <Badge variant="secondary">
            <CircleCheckIcon />
            Confirmée
          </Badge>
        ) : (
          <Badge variant="outline">Non confirmée</Badge>
        )}
      </div>

      {/*
        La vérification est non bloquante (D6) : rien n'empêche d'utiliser
        l'application sans adresse confirmée. Il faut donc bien que quelque
        chose la rappelle, sinon « non bloquante » revient à « jamais faite ».
      */}
      {!user.emailVerified && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={state === "sending" || state === "sent"}
            aria-busy={state === "sending"}
            onClick={() => void resend()}
          >
            {state === "sending" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <MailIcon data-icon="inline-start" />
            )}
            Renvoyer l’e-mail de confirmation
          </Button>

          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {state === "sent" && "Envoyé. Regardez votre boîte de réception."}
            {state === "failed" && "L’envoi a échoué. Réessayez dans un instant."}
          </p>
        </div>
      )}
    </SettingsSection>
  );
}
