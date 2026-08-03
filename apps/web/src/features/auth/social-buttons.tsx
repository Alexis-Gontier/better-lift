"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@better-lift/ui/components/button";
import { Spinner } from "@better-lift/ui/components/spinner";

import { GitHubMark } from "./provider-marks";
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
 * **GitHub est le seul fournisseur** (D26) : le public visé l'a déjà, et une
 * seconde OAuth App est une dépendance de plus à tenir pour un gain marginal.
 * La liste reste un tableau parce qu'Apple s'y ajoutera avant la première
 * soumission iOS, pas avant (doc 04).
 */
const PROVIDERS = [{ id: "github", label: "continueWithGitHub", Mark: GitHubMark }] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

/**
 * `callbackURL` doit être **absolue**. C'est l'API qui effectue la redirection
 * de fin d'OAuth : un chemin relatif s'y résoudrait sur son origine à elle
 * (`:3001`), et l'utilisateur atterrirait sur du JSON au lieu du tableau de
 * bord. On la construit donc depuis l'origine du web, au clic — le composant
 * est client, `window` est disponible.
 */
export function SocialButtons({ callbackPath }: { callbackPath: string }) {
  /**
   * `signIn.social` déclenche une navigation plein écran vers le fournisseur,
   * mais pas instantanément : il faut d'abord un aller-retour vers l'API pour
   * obtenir l'URL d'autorisation. Sans retour visuel, ce délai se lit comme un
   * bouton mort, et on reclique.
   *
   * L'état n'est relâché qu'en cas d'échec : sinon la page part, et le remettre
   * à zéro ferait clignoter le bouton juste avant qu'elle disparaisse.
   */
  const [pending, setPending] = useState<ProviderId | null>(null);
  const t = useTranslations("AuthFields");

  async function start(provider: ProviderId) {
    setPending(provider);

    const result = await signIn.social({
      provider,
      callbackURL: new URL(callbackPath, window.location.origin).toString(),
    });

    if (result.error) {
      setPending(null);
    }
  }

  return (
    // `gap-2` : 8 px entre deux cibles tactiles, sinon le pouce attrape l'autre.
    <div className="flex flex-col gap-2">
      {PROVIDERS.map(({ id, label, Mark }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          size="lg"
          disabled={pending !== null}
          aria-busy={pending === id}
          onClick={() => void start(id)}
          className="w-full"
        >
          {pending === id ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Mark data-icon="inline-start" />
          )}
          {t(label)}
        </Button>
      ))}
    </div>
  );
}
