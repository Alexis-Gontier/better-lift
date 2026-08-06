"use client";

import { PanelLeftIcon } from "lucide-react";
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
  SidebarSeparator,
  useSidebar,
} from "@better-lift/ui/components/sidebar";

import { isNavItemActive } from "./active";
import { MAIN_NAV, type NavItem, SECONDARY_NAV } from "./nav-items";
import { UserMenu } from "./user-menu";

function NavMenu({
  items,
  pathname,
  children,
}: {
  items: readonly NavItem[];
  pathname: string;
  /** Entrées supplémentaires dans la même liste — le repli, entre autres. */
  children?: React.ReactNode;
}) {
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
      {children}
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
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="better-lift">
              <Link href="/dashboard">
                {/*
                  Le vrai logo du site (`app/icon.svg`, le favicon), pas un
                  carré de marque improvisé — et seul élément visible quand la
                  sidebar est repliée. `aria-hidden` parce que le nom qui suit
                  le dit déjà — sans quoi il serait lu deux fois.

                  Couleurs dupliquées à la main plutôt qu'un `<img src>` : le
                  favicon reste un fichier statique séparé (convention Next),
                  et une poignée de chemins ne justifie pas d'aller chercher un
                  fichier externe pour ce que quatre lignes de JSX couvrent
                  sans requête ni layout shift. Fixes et non liées aux tokens
                  `primary`/`background` : une marque garde son identité propre
                  quel que soit le thème de l'interface qui l'entoure, comme
                  n'importe quel logo d'app.

                  Le vert d'origine (`#7ad6a5`) est retiré : la palette de
                  l'app est achromatique (D25), et un logo qui reste coloré
                  quand plus rien d'autre ne l'est jure au premier coup d'œil.
                */}
                <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 shrink-0">
                  <rect width="32" height="32" rx="7" fill="#101418" />
                  <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
                    <path d="M6 16h20" />
                    <path d="M9 11v10M12 12.5v7M23 11v10M20 12.5v7" />
                  </g>
                </svg>
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

      {/*
        Bord à bord et non `SidebarSeparator` (qui s'inset de `mx-2`) : sous le
        logo comme au-dessus du compte, le trait marque une vraie coupure entre
        trois blocs — marque, navigation, compte — et un filet qui s'arrête
        avant le bord ne lirait pas comme une limite mais comme un ornement.
      */}
      <SidebarSeparator className="mx-0" />

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
              <NavMenu items={SECONDARY_NAV} pathname={pathname}>
                <SidebarMenuItem>
                  {/*
                    Le repli n'a plus de barre haute pour le porter (doc 05) :
                    il vit ici, sous Réglages, dans la même forme que le reste
                    de la colonne — un lien, icône et libellé — plutôt qu'un
                    bouton d'icône isolé, seule commande qui n'avait pas cette
                    forme.

                    Pas de `SidebarTrigger` : la primitive fige son contenu
                    (icône + texte réduit à `sr-only`), impossible à faire
                    coexister avec un libellé visible. `toggleSidebar`
                    directement, sur un `SidebarMenuButton` ordinaire.

                    Le libellé et l'infobulle disent des choses différentes,
                    et c'est voulu : le libellé n'apparaît que dépliée, où la
                    seule action possible est de réduire ; l'infobulle
                    n'apparaît que repliée à l'icône (`tooltip`, comme les
                    autres entrées), où la seule action possible est de
                    déplier.
                  */}
                  <SidebarMenuButton onClick={toggleSidebar} tooltip="Afficher la navigation">
                    <PanelLeftIcon />
                    <span>Réduire</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </NavMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarSeparator className="mx-0" />

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>

      {/*
        La poignée qui borde la colonne : une cible de repli à la souris, large
        et sur tout le bord, ailleurs que sur le lien « Réduire ». Elle porte
        `tabIndex={-1}` dans la primitive et n'est donc pas atteignable au
        clavier — c'est voulu, ce lien fait déjà ce travail et deux commandes
        identiques dans l'ordre de tabulation ne feraient que l'allonger. Le
        libellé est réécrit en français pour la même raison.
      */}
      <SidebarRail
        aria-label="Afficher ou masquer la navigation"
        title="Afficher ou masquer la navigation"
      />
    </Sidebar>
  );
}
