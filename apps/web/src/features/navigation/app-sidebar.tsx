"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@better-lift/ui/components/sidebar";

import { isNavItemActive } from "./active";
import { MAIN_NAV, type NavItem, SECONDARY_NAV } from "./nav-items";
import { UserMenu } from "./user-menu";

function NavMenu({ items, pathname }: { items: readonly NavItem[]; pathname: string }) {
  return (
    <SidebarMenu>
      {items.map(({ href, label, icon: Icon }) => {
        const active = isNavItemActive(pathname, href);

        return (
          <SidebarMenuItem key={href}>
            {/*
              `isActive` pilote l'apparence, `aria-current` l'annonce. Les deux
              sont nécessaires : la mise en évidence visuelle ne dit rien à un
              lecteur d'écran, et « où suis-je » est précisément la question à
              laquelle une navigation doit répondre.

              `tooltip` redonne le libellé une fois la sidebar repliée en
              icônes — c'est le seul moment où il s'affiche.

              L'apparence de l'état actif est celle de la primitive, sans
              surcouche : le fond `sidebar-accent` est le même qu'au survol, et
              seule la graisse du libellé les sépare. C'est ténu à l'œil, mais
              la palette est achromatique et il n'y a pas de couleur d'accent à
              mobiliser sans en réintroduire une. `aria-current` porte
              l'information là où elle compte le plus.
            */}
            <SidebarMenuButton asChild isActive={active} tooltip={label}>
              <Link href={href} aria-current={active ? "page" : undefined}>
                <Icon />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

/**
 * Colonne de navigation de la zone authentifiée (doc 05).
 *
 * `collapsible="icon"` et non `"offcanvas"` : sur grand écran, replier ne doit
 * pas faire disparaître la navigation mais la réduire à ses pictogrammes. Sous
 * le seuil `md`, la primitive bascule d'elle-même en tiroir `Sheet`, sans qu'on
 * ait à maintenir une seconde mise en page.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="better-lift">
              <Link href="/dashboard">
                {/*
                  Le carré de marque tient lieu de logo et reste seul visible
                  quand la sidebar est repliée. `aria-hidden` parce que le nom
                  qui suit le dit déjà — sans quoi il serait lu deux fois.
                */}
                <span
                  aria-hidden="true"
                  className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground"
                >
                  b
                </span>
                {/*
                  Les capitales viennent de `uppercase`, pas du texte source :
                  écrire « BETTER-LIFT » en dur ferait épeler le mot lettre par
                  lettre à certains lecteurs d'écran. `tracking-wide` est
                  indissociable — des capitales au crénage d'un texte en bas de
                  casse se touchent. Même traitement qu'en `(auth)/layout.tsx`.
                */}
                <span className="truncate font-semibold tracking-wide uppercase">better-lift</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/*
          `SidebarContent` ne rend qu'un `<div>` : sans ce `<nav>`, la colonne
          n'est plus un repère de navigation, et « aller à la navigation » — un
          des tout premiers gestes d'un lecteur d'écran — ne mène nulle part.
          Les deux groupes tiennent sous un seul repère parce qu'ils forment une
          seule navigation ; deux `<nav>` obligeraient à en choisir un sans
          savoir lequel.

          Les classes reprennent celles de `SidebarContent`, dont ce `<nav>`
          devient l'enfant flex unique : sans elles, `mt-auto` plus bas n'aurait
          plus de hauteur à repousser.
        */}
        <nav aria-label="Navigation principale" className="flex min-h-0 flex-1 flex-col gap-2">
          <SidebarGroup>
            <SidebarGroupLabel>Entraînement</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMenu items={MAIN_NAV} pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>

          {/*
            `mt-auto` colle le second groupe au bas de la colonne : les réglages
            ne sont pas une étape du parcours, ils n'ont pas à s'intercaler dans
            la liste de ce qu'on consulte tous les jours.
          */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <NavMenu items={SECONDARY_NAV} pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>

      {/*
        La poignée qui borde la colonne : une cible de repli à la souris, large
        et sur tout le bord, ailleurs que sur le bouton de la barre haute. Elle
        porte `tabIndex={-1}` dans la primitive et n'est donc pas atteignable au
        clavier — c'est voulu, le bouton de la barre haute fait déjà ce travail
        et deux commandes identiques dans l'ordre de tabulation ne feraient que
        l'allonger. Le libellé est réécrit en français pour la même raison que
        dans la barre haute.
      */}
      <SidebarRail
        aria-label="Afficher ou masquer la navigation"
        title="Afficher ou masquer la navigation"
      />
    </Sidebar>
  );
}
