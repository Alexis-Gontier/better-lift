import { Link } from "@tanstack/react-router";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { type GenreRefus, MESSAGES_REFUS, refusDe } from "./refus";

const TEXTES = {
  connexion: {
    titre: "Connexion",
    action: "Se connecter",
    question: "Pas de compte ?",
    lien: "Créer un compte",
    vers: "/inscription",
  },
  inscription: {
    titre: "Créer un compte",
    action: "Créer le compte",
    question: "Déjà un compte ?",
    lien: "Se connecter",
    vers: "/connexion",
  },
} as const;

type Props = {
  mode: keyof typeof TEXTES;
  /** La page demandée avant la connexion : elle suit d'une page d'auth à l'autre. */
  redirect?: string;
  onSucces: () => void;
};

/** Le formulaire des deux pages d'auth (D196) : un titre, deux champs, un bouton, un lien. */
export function FormulaireAuth({ mode, redirect, onSucces }: Props) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [refus, setRefus] = useState<GenreRefus | null>(null);
  const t = TEXTES[mode];
  const id = useId();

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setRefus(null);
    try {
      const { error } =
        mode === "connexion"
          ? await authClient.signIn.email({ email, password: motDePasse })
          : await authClient.signUp.email({ email, password: motDePasse, name: email });
      if (error) setRefus(refusDe(error.status));
      else onSucces();
    } catch {
      setRefus("reseau");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="flex w-full flex-col gap-4">
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
          aria-invalid={refus !== null}
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
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          aria-invalid={refus !== null}
        />
      </div>
      {/* La couleur rend l'erreur trouvable ; `role="alert"` la dit aux lecteurs d'écran. */}
      {refus ? (
        <p role="alert" className="text-sm text-destructive-ink">
          {MESSAGES_REFUS[refus]}
        </p>
      ) : null}
      <Button type="submit" disabled={enCours} className="mt-1">
        {enCours ? "…" : t.action}
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
