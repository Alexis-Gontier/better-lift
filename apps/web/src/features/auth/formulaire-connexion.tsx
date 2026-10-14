import { Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const TEXTES = {
  connexion: {
    titre: "Connexion",
    sousTitre: "Reprends là où tu t'étais arrêté.",
    action: "Se connecter",
    bascule: ["Pas encore de compte ?", "Créer un compte"],
  },
  creation: {
    titre: "Créer un compte",
    sousTitre: "Réservé aux adresses autorisées.",
    action: "Créer le compte",
    bascule: ["Déjà un compte ?", "Se connecter"],
  },
} as const;

const CHAMP = "h-10 rounded-[10px] bg-secondary-background";

export function FormulaireConnexion({ onSucces }: { onSucces: () => void }) {
  const [mode, setMode] = useState<"connexion" | "creation">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);
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
  const t = TEXTES[mode];

  return (
    <form onSubmit={soumettre} className="flex w-full flex-col">
      <h1 className="text-2xl font-extrabold tracking-tight">{t.titre}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{t.sousTitre}</p>

      <label htmlFor="email" className="mt-8 text-sm font-medium">
        Adresse e-mail
      </label>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        placeholder="toi@exemple.fr"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={invalide}
        className={`mt-2 ${CHAMP}`}
      />

      <label htmlFor="mdp" className="mt-5 text-sm font-medium">
        Mot de passe
      </label>
      <div className="relative mt-2">
        <Input
          id="mdp"
          type={visible ? "text" : "password"}
          autoComplete={mode === "connexion" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          aria-invalid={invalide}
          className={`pr-10 ${CHAMP}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {/* La couleur ne fait que rendre l'erreur trouvable : elle se dit aussi en
          toutes lettres, et `role="alert"` la porte pour les lecteurs d'écran. */}
      {refus ? (
        <p role="alert" className="mt-4 text-sm text-destructive-ink">
          {MESSAGES[refus]}
        </p>
      ) : null}

      <Button type="submit" disabled={enCours} className="mt-6 h-10 font-bold">
        {enCours ? "…" : t.action}
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.bascule[0]}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "connexion" ? "creation" : "connexion");
            setRefus(null);
          }}
          className="font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t.bascule[1]}
        </button>
      </p>
    </form>
  );
}
