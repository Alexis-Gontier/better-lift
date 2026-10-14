import { createFileRoute } from "@tanstack/react-router";

/**
 * Aucune routine ouverte : les cartes prennent toute la largeur (D216) et la mise en page ne
 * monte pas de panneau de droite. La route existe pour que `/routines` corresponde.
 */
export const Route = createFileRoute("/_authenticated/routines/")({ component: () => null });
