import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@better-lift/ui/components/sidebar";

import { AppSidebar } from "@/features/navigation/app-sidebar";
import { AppTopbar } from "@/features/navigation/app-topbar";

/**
 * Coquille de la zone authentifiée : sidebar repliable, barre haute, contenu
 * (doc 05).
 *
 * Aucune vérification de session ici : c'est `proxy.ts` qui écarte les
 * visiteurs anonymes en amont, et l'API qui fait autorité en aval. Ce layout
 * ne fait pas d'appel réseau et reste un Server Component — seules la sidebar
 * et la barre haute passent en client, parce qu'elles lisent le chemin courant.
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
        <AppTopbar />

        {/*
          Un `<div>` et surtout pas un `<main>` : `SidebarInset` **est** déjà
          l'élément `<main>` (cf. la primitive). En emboîter un second serait du
          balisage invalide et donnerait deux repères « contenu principal » à un
          lecteur d'écran, qui ne saurait plus lequel désigne la page.

          C'est aussi pourquoi les écrans du groupe rendent du contenu nu : leur
          `<main>` d'origine se serait retrouvé imbriqué dans celui-ci dès
          l'introduction de la coquille.

          `max-w-6xl` et non `max-w-3xl` : la doc 05 demande quatre cartes de
          KPI sur une ligne au tableau de bord et un éditeur de routines à deux
          colonnes.

          `flex flex-col` sert les écrans qui se centrent verticalement
          (`error.tsx`, `not-found.tsx` et leur `flex-1`). `min-w-0` est la
          précaution habituelle du flux flex — sans lui, un tableau large refuse
          de se réduire et pousse toute la colonne hors de l'écran au lieu de
          défiler dans son coin.
        */}
        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
