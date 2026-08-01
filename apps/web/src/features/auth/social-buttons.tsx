"use client";

import { signIn } from "@/lib/auth-client";

/**
 * Connexion par fournisseur tiers.
 *
 * Les boutons sont affichés inconditionnellement alors que l'API n'enregistre
 * un fournisseur que si ses identifiants OAuth existent. C'est délibéré : le
 * web n'a aucun moyen de savoir ce qui est configuré côté serveur sans une
 * requête supplémentaire, et un bouton qui renvoie une erreur explicite se
 * diagnostique mieux qu'un bouton absent — lequel passerait pour un bug de
 * rendu.
 *
 * Apple viendra avant la première soumission iOS, pas avant (doc 04).
 */
const PROVIDERS = [
  { id: "github", label: "Continuer avec GitHub" },
  { id: "google", label: "Continuer avec Google" },
] as const;

/**
 * `callbackURL` doit être **absolue**. C'est l'API qui effectue la redirection
 * de fin d'OAuth : un chemin relatif s'y résoudrait sur son origine à elle
 * (`:3001`), et l'utilisateur atterrirait sur du JSON au lieu du tableau de
 * bord. On la construit donc depuis l'origine du web, au clic — le composant
 * est client, `window` est disponible.
 */
export function SocialButtons({ callbackPath }: { callbackPath: string }) {
  return (
    <div className="space-y-2">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() =>
            void signIn.social({
              provider: provider.id,
              callbackURL: new URL(callbackPath, window.location.origin).toString(),
            })
          }
          className="w-full rounded-lg px-3 py-2 font-medium ring-1 ring-white/15 hover:bg-surface-raised"
        >
          {provider.label}
        </button>
      ))}
    </div>
  );
}
