"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@better-lift/ui/components/separator";
import { SidebarTrigger } from "@better-lift/ui/components/sidebar";

import { findActiveNavItem } from "./active";
import { MAIN_NAV, SECONDARY_NAV } from "./nav-items";

/**
 * Barre haute de la zone authentifiée.
 *
 * Elle porte deux choses et pas une de plus : la commande de repli de la
 * sidebar — indispensable sur mobile, où c'est le seul accès au tiroir — et le
 * nom de la section courante. Tout le reste (titre de l'écran, actions) relève
 * de la page, qui seule sait ce qu'elle affiche.
 *
 * `sticky` plutôt que `fixed` : la barre reste dans le flux, donc le contenu
 * n'a pas à compenser sa hauteur par une marge à maintenir en double.
 */
export function AppTopbar() {
  const pathname = usePathname();
  const section = findActiveNavItem(pathname, [...MAIN_NAV, ...SECONDARY_NAV]);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      {/*
        Le nom accessible est réécrit ici : la primitive embarque un
        « Toggle Sidebar » en dur, et c'est le seul intitulé de ce bouton — il
        n'a pas de texte visible. `aria-label` l'emporte sur le contenu, donc il
        suffit à le traduire sans toucher au fichier du registre.
      */}
      <SidebarTrigger
        className="-ml-1"
        aria-label="Afficher ou masquer la navigation"
        title="Afficher ou masquer la navigation"
      />

      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />

      {/*
        `findActiveNavItem` renvoie `undefined` sur un chemin qu'aucune
        destination ne couvre. On préfère alors la marque à un libellé faux :
        une barre vide se remarque moins qu'une barre qui ment.
      */}
      <span className="truncate text-sm font-medium">
        {section?.label ?? <span className="tracking-wide uppercase">better-lift</span>}
      </span>
    </header>
  );
}
