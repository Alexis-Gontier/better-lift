"use client";

import { SidebarTrigger } from "@better-lift/ui/components/sidebar";

/**
 * Seul point d'entrée vers la navigation quand le tiroir mobile est fermé.
 *
 * Sous le seuil `md` (768 px, celui que suit `useIsMobile`), la sidebar
 * devient un tiroir `Sheet` hors écran plutôt que de se replier en icônes : le
 * `SidebarTrigger` qui vit désormais dans son en-tête (`AppSidebar`) est donc
 * lui-même caché tant que le tiroir est fermé — précisément l'état où on a
 * besoin de l'ouvrir. Ce bouton flottant, posé en dehors de la sidebar et
 * visible uniquement sous ce seuil, referme la boucle.
 *
 * `fixed` et non `sticky` : il n'y a plus de barre haute pour l'ancrer dans le
 * flux, et il doit rester atteignable quelle que soit la position de
 * défilement de l'écran en dessous.
 *
 * Sur desktop il ne sert à rien et disparaît (`md:hidden`, donc absent de
 * l'ordre de tabulation, pas seulement masqué) : le bouton de l'en-tête de la
 * sidebar suffit, `collapsible="icon"` y réduisant la colonne à ses
 * pictogrammes plutôt que de la faire disparaître.
 */
export function MobileSidebarTrigger() {
  return (
    <SidebarTrigger
      className="fixed top-3 left-3 z-20 border border-border bg-background shadow-sm md:hidden"
      aria-label="Afficher la navigation"
      title="Afficher la navigation"
    />
  );
}
