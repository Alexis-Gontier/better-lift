"use client";

import { Toaster } from "@better-lift/ui/components/sonner";

/**
 * Notifications éphémères de l'app.
 *
 * ## Ce qu'elles sont, et ce qu'elles ne remplacent pas
 *
 * Un toast annonce qu'une action **a eu lieu** quand l'écran ne le montre pas
 * de lui-même : dupliquer une routine, créer un dossier, archiver un exercice.
 * Jusqu'ici ces gestes étaient muets — le seul signal était une liste qui
 * changeait, et il fallait déjà savoir où regarder.
 *
 * Il ne remplace **ni** l'erreur de formulaire, qui reste sous son champ
 * (doc 05), **ni** l'état d'une requête en cours, qui reste sur le bouton
 * (`Spinner` + `disabled` + `aria-busy`). Un toast est un compte rendu, pas un
 * indicateur de progression : il apparaît une fois l'affaire close.
 *
 * ## Placement et accessibilité
 *
 * `richColors` est écarté : la palette est achromatique et `destructive` est
 * la seule couleur de l'interface (D25). Un toast vert de succès y ferait
 * entrer une teinte que rien d'autre ne porte, et affaiblirait le rouge —
 * seul signal qui doit se distinguer sans être lu.
 *
 * Sonner rend une région `aria-live` et gère la mise au point : un toast
 * porteur d'une action reste atteignable au clavier (`F6`). On ne met donc
 * jamais une information **indispensable** dans un toast — il s'efface — mais
 * l'annonce, elle, est faite correctement.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      /*
        En bas à droite, et non en haut : sans barre haute, le contenu
        commence directement au bord supérieur de l'écran, et un toast qui le
        recouvre cache précisément ce qu'on regardait. À gauche, il tomberait
        sur la sidebar.
      */
      closeButton
      /*
        Quatre secondes : le temps de lire une phrase courte sans que le toast
        s'installe. Les erreurs, elles, portent une durée plus longue au cas
        par cas — c'est le seul endroit où on veut laisser relire.
      */
      duration={4000}
    />
  );
}
