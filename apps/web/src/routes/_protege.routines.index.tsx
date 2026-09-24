import { createFileRoute } from "@tanstack/react-router";
import { EtatVide } from "@/components/etats/etat-vide";

/**
 * Aucune routine ouverte : l'espace de travail reste en place et invite à
 * choisir, plutôt que de disparaître et de faire sauter la mise en page.
 */
export const Route = createFileRoute("/_protege/routines/")({
  component: () => (
    <EtatVide
      titre="Aucune routine ouverte"
      message="Choisis une routine à gauche pour la voir ou la modifier, ou crées-en une."
    />
  ),
});
