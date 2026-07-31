"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { signIn, signUp } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

const LABELS: Record<Mode, { action: string; toggle: string; other: Mode }> = {
  "sign-in": { action: "Se connecter", toggle: "Créer un compte", other: "sign-up" },
  "sign-up": { action: "Créer le compte", toggle: "J’ai déjà un compte", other: "sign-in" },
};

/**
 * Formulaire du spike d'authentification. Volontairement brut : il valide la
 * chaîne de session, pas l'ergonomie — l'écran définitif viendra avec la V1
 * (doc 05).
 */
export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const labels = LABELS[mode];

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const result =
      mode === "sign-up"
        ? await signUp.email({ email, password, name })
        : await signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Échec de l’authentification.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "sign-up" && (
          <label className="block space-y-1.5">
            <span className="text-sm text-ink-muted">Nom</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg bg-surface-raised px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-accent"
            />
          </label>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm text-ink-muted">Adresse e-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg bg-surface-raised px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-accent"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-ink-muted">Mot de passe</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg bg-surface-raised px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-accent"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-3 py-2 font-medium text-surface disabled:opacity-50"
        >
          {pending ? "…" : labels.action}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-ink-muted">
        <span className="h-px flex-1 bg-white/10" />
        ou
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {/*
        Le fournisseur n'est enregistré côté API que si l'OAuth App existe ;
        sans identifiants, ce bouton renvoie une erreur explicite plutôt que de
        disparaître silencieusement.
      */}
      <button
        type="button"
        onClick={() => void signIn.social({ provider: "github", callbackURL: "/" })}
        className="w-full rounded-lg px-3 py-2 font-medium ring-1 ring-white/15 hover:bg-surface-raised"
      >
        Continuer avec GitHub
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(labels.other);
          setError(null);
        }}
        className="w-full text-sm text-ink-muted underline underline-offset-4"
      >
        {labels.toggle}
      </button>
    </div>
  );
}
