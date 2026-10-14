import { Link } from "@tanstack/react-router";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { REFUSAL_MESSAGES, type RefusalKind, refusalOf } from "./refusal";

const TEXTS = {
  connexion: {
    titre: "Connexion",
    action: "Se connecter",
    question: "Pas de compte ?",
    lien: "Créer un compte",
    vers: "/register",
  },
  inscription: {
    titre: "Créer un compte",
    action: "Créer le compte",
    question: "Déjà un compte ?",
    lien: "Se connecter",
    vers: "/login",
  },
} as const;

type Props = {
  mode: keyof typeof TEXTS;
  /** La page demandée avant la connexion : elle suit d'une page d'auth à l'autre. */
  redirect?: string;
  onSuccess: () => void;
};

/** Le formulaire des deux pages d'auth (D196) : un titre, deux champs, un bouton, un lien. */
export function AuthForm({ mode, redirect, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [refusal, setRefusal] = useState<RefusalKind | null>(null);
  const t = TEXTS[mode];
  const id = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setRefusal(null);
    try {
      const { error } =
        mode === "connexion"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name: email });
      if (error) setRefusal(refusalOf(error.status));
      else onSuccess();
    } catch {
      setRefusal("reseau");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4">
      <h1 className="mb-2 text-3xl">{t.titre}</h1>
      <div className="flex flex-col gap-1.5 text-sm">
        <label htmlFor={`${id}-email`}>E-mail</label>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={refusal !== null}
        />
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        <label htmlFor={`${id}-mdp`}>Mot de passe</label>
        <Input
          id={`${id}-mdp`}
          type="password"
          autoComplete={mode === "connexion" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={refusal !== null}
        />
      </div>
      {/* La couleur rend l'erreur trouvable ; `role="alert"` la dit aux lecteurs d'écran. */}
      {refusal ? (
        <p role="alert" className="text-sm text-destructive-ink">
          {REFUSAL_MESSAGES[refusal]}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "…" : t.action}
      </Button>
      <p className="text-sm">
        {t.question}{" "}
        <Link
          to={t.vers}
          search={{ redirect }}
          className="font-bold underline decoration-2 underline-offset-4"
        >
          {t.lien}
        </Link>
      </p>
    </form>
  );
}
