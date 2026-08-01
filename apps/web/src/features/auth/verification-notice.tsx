"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { sendVerificationEmail, useSession } from "@/lib/auth-client";

/**
 * Le pendant visible de la vérification non bloquante (doc 09 D6).
 *
 * Puisque rien n'empêche d'utiliser l'application sans adresse confirmée, il
 * faut bien que quelque chose le rappelle — sinon la décision « non bloquante »
 * revient en pratique à « jamais vérifié ». D'où ce bandeau, présent tant que
 * l'adresse ne l'est pas, et qui n'interrompt rien.
 */
export function VerificationNotice() {
  const searchParams = useSearchParams();
  const session = useSession();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  // Le lien de l'e-mail revient sur `/dashboard?verified=1`.
  if (searchParams.get("verified")) {
    return (
      <p role="status" className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">
        Adresse e-mail confirmée.
      </p>
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-raised px-4 py-3 ring-1 ring-white/10">
      <p className="text-sm text-ink-muted">
        Votre adresse <span className="text-ink">{user.email}</span> n’est pas confirmée.
      </p>

      {state === "sent" ? (
        <span role="status" className="text-sm text-accent">
          E-mail renvoyé.
        </span>
      ) : (
        <button
          type="button"
          disabled={state === "sending"}
          onClick={() => void resend(user.email)}
          className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-surface disabled:opacity-50"
        >
          {state === "sending" ? "…" : state === "failed" ? "Réessayer" : "Renvoyer l’e-mail"}
        </button>
      )}
    </div>
  );
}
