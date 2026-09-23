import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

// Trois refus, trois gestes différents. Les confondre est le défaut classique :
// on laisse quelqu'un retaper dix fois un mot de passe correct pour une adresse
// qui ne sera jamais acceptée.
type GenreRefus = "identifiants" | "listeBlanche" | "reseau";

const MESSAGES: Record<GenreRefus, string> = {
  identifiants: "Adresse ou mot de passe incorrect.",
  listeBlanche: "Cette adresse n'est pas autorisée à créer un compte. Inutile de réessayer.",
  reseau: "L'API est injoignable. Ce n'est pas toi — réessaie dans un instant.",
};

const CHAMP =
  "rounded-md border border-(--line) bg-(--surface-1) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) aria-[invalid=true]:border-(--danger)";

export function FormulaireConnexion({ onSucces }: { onSucces: () => void }) {
  const [mode, setMode] = useState<"connexion" | "creation">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [refus, setRefus] = useState<GenreRefus | null>(null);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setRefus(null);

    try {
      const { error } =
        mode === "connexion"
          ? await authClient.signIn.email({ email, password: motDePasse })
          : await authClient.signUp.email({ email, password: motDePasse, name: email });

      if (!error) {
        onSucces();
        return;
      }

      // 403 est le code que le garde de liste blanche renvoie : c'est lui qui
      // distingue « cette adresse n'aura jamais de compte » de « tu t'es trompé ».
      setRefus(error.status === 403 ? "listeBlanche" : "identifiants");
    } catch {
      setRefus("reseau");
    } finally {
      setEnCours(false);
    }
  }

  const invalide = refus !== null;

  return (
    <form onSubmit={soumettre} className="flex w-full flex-col gap-3">
      <label htmlFor="email" className="text-sm text-(--ink-muted)">
        Adresse e-mail
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={invalide}
        className={CHAMP}
      />

      <label htmlFor="mdp" className="text-sm text-(--ink-muted)">
        Mot de passe
      </label>
      <input
        id="mdp"
        type="password"
        autoComplete={mode === "connexion" ? "current-password" : "new-password"}
        required
        minLength={8}
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
        aria-invalid={invalide}
        className={CHAMP}
      />

      {/* La couleur ne fait que rendre l'erreur trouvable : elle se dit aussi en
          toutes lettres, et `role="alert"` la porte pour les lecteurs d'écran. */}
      {refus ? (
        <p role="alert" className="text-sm text-(--danger-ink)">
          {MESSAGES[refus]}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enCours}
        className="mt-1 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)"
      >
        {enCours ? "…" : mode === "connexion" ? "Se connecter" : "Créer le compte"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "connexion" ? "creation" : "connexion");
          setRefus(null);
        }}
        className="text-sm text-(--ink-subtle) underline-offset-2 hover:underline"
      >
        {mode === "connexion" ? "Créer un compte" : "J'ai déjà un compte"}
      </button>
    </form>
  );
}
