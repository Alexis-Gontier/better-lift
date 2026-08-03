"use client";

import { GiftIcon, ListChecksIcon, TrophyIcon } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Panneau éditorial des écrans d'authentification.
 *
 * Il ne porte ni témoignage ni logo client : inventer des gens qui n'existent
 * pas pour meubler une colonne, c'est fabriquer une preuve. À la place, trois
 * promesses que le produit tient réellement — chacune vérifiable dans la doc 01.
 *
 * Composant **client** depuis l'internationalisation (D29) : il n'a toujours
 * aucun état, mais la langue est résolue côté client — il n'existe pas de
 * traduction côté serveur, faute de locale dans l'URL.
 *
 * `hidden lg:flex` le retire de l'arbre d'accessibilité sous 1024 px, ce qui est
 * l'intention : sur mobile, le formulaire est la seule chose à l'écran et faire
 * lire trois arguments avant d'y arriver serait un obstacle, pas un renfort.
 */
const BENEFITS = [
  { Icon: ListChecksIcon, key: "routines" },
  { Icon: TrophyIcon, key: "records" },
  { Icon: GiftIcon, key: "free" },
] as const;

export function AuthPanel() {
  const t = useTranslations("AuthPanel");

  return (
    /*
      Contenu **centré** dans le panneau, pas calé sur la gouttière de gauche.
      À 65 % de large, un bloc aligné à gauche laisse tout le vide du même côté
      et le texte se lit comme s'il fuyait la couture. Centré, le vide se répartit
      et la colonne redevient une composition. Les `px-*` ne servent plus que de
      gouttière minimale, pour les largeurs où le contenu touche les bords.
    */
    <aside className="relative hidden overflow-hidden border-r border-border bg-muted/30 lg:order-1 lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-14 xl:px-20">
      {/*
        Halo décoratif. `aria-hidden` et `pointer-events-none` : il n'a rien à
        dire et ne doit rien intercepter. Un dégradé radial en `oklch` plutôt
        qu'une image — il suit les tokens, donc il change avec le thème au lieu
        d'être un carré clair posé sur un fond sombre.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 size-128 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,transparent_70%)] opacity-[0.07]"
      />

      {/*
        `max-w-lg` puis `xl:max-w-xl` : la largeur du bloc suit celle de la
        colonne au lieu de rester figée. À 1024 px le contenu remplit la
        gouttière ; au-delà il s'élargit jusqu'à 576 px et s'arrête là — une
        ligne de texte plus longue devient pénible à lire, la place gagnée doit
        rester du blanc.
      */}
      <div className="relative w-full max-w-lg xl:max-w-xl">
        {/*
          Un `<p>` et non un titre : le `<h1>` de la page est celui du
          formulaire. Deux titres de même niveau feraient croire à deux écrans.
        */}
        {/*
          `whitespace-pre-line` : la coupure de ligne fait partie du texte et
          vit donc dans le catalogue. Un `<br />` codé en dur imposerait la
          même césure à toutes les langues, alors qu'elle dépend de la phrase.
        */}
        <p className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight whitespace-pre-line text-balance xl:text-5xl">
          {t("headline")}
        </p>

        <div className="mt-8 h-px w-12 bg-border" />

        <ul className="mt-8 space-y-6">
          {BENEFITS.map(({ Icon, key }) => (
            <li key={key} className="flex gap-3.5">
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                strokeWidth={2}
              />
              <div className="space-y-1">
                <p className="text-sm leading-snug font-medium">{t(`${key}.title`)}</p>
                <p className="text-sm leading-normal text-muted-foreground text-pretty">
                  {t(`${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
