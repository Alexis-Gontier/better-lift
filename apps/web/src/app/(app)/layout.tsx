import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@better-lift/ui/components/sidebar";

import { AppContent } from "@/features/navigation/app-content";
import { AppSidebar } from "@/features/navigation/app-sidebar";
import { MobileSidebarTrigger } from "@/features/navigation/mobile-sidebar-trigger";

/**
 * Coquille de la zone authentifiée : sidebar repliable, contenu (doc 05).
 *
 * Pas de barre haute séparée : le repli de la sidebar (`SidebarTrigger`) vit
 * dans son propre en-tête, et chaque écran porte son titre lui-même — rien
 * d'autre ne justifiait une barre à part.
 *
 * Aucune vérification de session ici : c'est `proxy.ts` qui écarte les
 * visiteurs anonymes en amont, et l'API qui fait autorité en aval. Ce layout
 * ne fait pas d'appel réseau et reste un Server Component — seuls la sidebar,
 * son bouton de repli mobile et `AppContent` passent en client, parce qu'ils
 * lisent le chemin courant ou l'état d'ouverture du tiroir.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  /*
    L'état replié est persisté par la primitive dans le cookie `sidebar_state`,
    et il faut le relire **au serveur**. Sans ça, le premier rendu montre
    toujours la sidebar dépliée, puis l'hydratation la replie : 16 rem qui
    sautent sur chaque chargement de page, pour qui a justement choisi de la
    replier.

    `cookies()` est asynchrone depuis Next 15 — d'où le layout `async`. Lire un
    cookie exclut ce segment du rendu statique, ce qui n'a aucun coût ici :
    toutes les routes du groupe sont derrière une session de toute façon.
  */
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar />

      <SidebarInset>
        <MobileSidebarTrigger />

        {/*
          `AppContent` et surtout pas un `<main>` : `SidebarInset` **est** déjà
          l'élément `<main>` (cf. la primitive). En emboîter un second serait du
          balisage invalide et donnerait deux repères « contenu principal » à un
          lecteur d'écran, qui ne saurait plus lequel désigne la page.

          C'est aussi pourquoi les écrans du groupe rendent du contenu nu : leur
          `<main>` d'origine se serait retrouvé imbriqué dans celui-ci dès
          l'introduction de la coquille.

          La mesure de lecture — `max-w-7xl` centrée — y est appliquée à tous
          les écrans **sauf `/routines`**, qui prend la largeur entière parce
          que sa colonne de navigation doit toucher le bord. Le détail du
          raisonnement, et les deux solutions écartées, sont dans le composant :
          c'est la seule exception de mise en page de toute la zone
          authentifiée, elle mérite d'être justifiée là où elle s'écrit.
        */}
        <AppContent>{children}</AppContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
