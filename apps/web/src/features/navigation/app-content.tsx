"use client";

import { usePathname } from "next/navigation";

import { cn } from "@better-lift/ui/lib/utils";

/**
 * Conteneur du contenu de la zone authentifiée.
 *
 * Il applique la mesure de lecture — `max-w-7xl`, centrée, avec ses marges —
 * à tous les écrans **sauf `/routines`**, qui occupe la largeur entière.
 *
 * ## Pourquoi une exception, et pourquoi ici
 *
 * `/routines` a une colonne de navigation à gauche, et une colonne de
 * navigation doit toucher le bord : décollée de 192 px sur un écran de 1920,
 * elle ne se lit plus comme la continuation de la barre latérale de l'app mais
 * comme un panneau qui flotte. Or le centrage du conteneur produit exactement
 * ce décollement dès que la fenêtre dépasse la mesure.
 *
 * Deux autres solutions ont été écartées :
 *
 * - **Un groupe de routes `(contained)`** qui aurait porté le conteneur, en
 *   laissant `/routines` à la racine de `(app)`. C'est la forme la plus
 *   idiomatique — mais elle déplace cinq segments, donc cinq dossiers, pour un
 *   layout qui tient en trois lignes.
 * - **Une marge négative** dans le layout de `/routines`. Elle annule le
 *   `px-8`, jamais le `mx-auto` : un enfant ne peut pas déborder la largeur
 *   maximale de son parent. Le décollement réapparaît au-delà de 1536 px de
 *   fenêtre, c'est-à-dire précisément sur les écrans où il se voit.
 *
 * Ce composant est client parce qu'il lit le chemin courant. Les écrans qu'il
 * enveloppe restent des Server Components : ils lui arrivent en `children`,
 * déjà rendus, et ne traversent pas la frontière.
 */
export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  /*
    Correspondance par segment, comme `isNavItemActive` : sans le slash, un
    hypothétique `/routines-archive` passerait aussi en pleine largeur.
  */
  const fullBleed = pathname === "/routines" || pathname.startsWith("/routines/");

  return (
    <div
      className={cn(
        /*
          `flex flex-col` sert les écrans qui se centrent verticalement
          (`error.tsx`, `not-found.tsx` et leur `flex-1`). `min-w-0` est la
          précaution habituelle du flux flex — sans lui, un tableau large refuse
          de se réduire et pousse toute la colonne hors de l'écran au lieu de
          défiler dans son coin.
        */
        "flex w-full min-w-0 flex-1 flex-col",
        fullBleed
          ? // Le volet pose lui-même ses marges : à lui de décider ce qui
            // touche le bord et ce qui respire.
            "px-0 py-0"
          : "mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8",
      )}
    >
      {children}
    </div>
  );
}
