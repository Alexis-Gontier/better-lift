import { Link, useRouteContext } from "@tanstack/react-router";
import { Dumbbell, History, LayoutDashboard, ListChecks, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { OUVRIR_PALETTE } from "./palette";

// Le Tableau de bord est la page d'arrivée (D134) ; le Profil vit en pied de barre.
const ENTREES = [
  { to: "/", label: "Tableau de bord", icone: LayoutDashboard },
  { to: "/seances", label: "Séances", icone: History },
  { to: "/routines", label: "Routines", icone: ListChecks },
  { to: "/exercices", label: "Exercices", icone: Dumbbell },
] as const;

/** Deux lettres tirées de l'adresse : « alexis.gontier » → « AG ». */
function initiales(email: string) {
  const [a = "", b = ""] = email.split("@")[0]?.split(/[._-]/) ?? [];
  return (a.charAt(0) + (b.charAt(0) || a.charAt(1))).toUpperCase() || "?";
}

export function NavLaterale() {
  const email = useRouteContext({ strict: false }).auth?.session?.user.email ?? "";

  return (
    <Sidebar variant="inset" collapsible="none" aria-label="Navigation principale">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <Logo />
                <span className="text-base font-extrabold tracking-tight text-(--ink)">
                  better-lift
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Rechercher (Ctrl K)"
              onClick={() => document.dispatchEvent(new Event(OUVRIR_PALETTE))}
            >
              <Search aria-hidden="true" />
              <span>Rechercher</span>
              <kbd className="ml-auto text-xs text-(--ink-faint)">Ctrl K</kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {ENTREES.map(({ to, label, icone: Icone }) => (
              <SidebarMenuItem key={to}>
                {/* `isActive` passe par le `data-active` que pose le lien actif : la
                    route décide, pas un état recopié. */}
                <SidebarMenuButton
                  asChild
                  tooltip={label}
                  className="h-9 data-[active=true]:font-bold"
                >
                  {/* Les filtres de l'URL (`?groupe=…`) ne doivent pas éteindre l'entrée ;
                      sans `exact`, `/` resterait actif sur toutes les pages. */}
                  <Link
                    to={to}
                    activeOptions={{ includeSearch: false, exact: to === "/" }}
                    activeProps={{ "data-active": true, "aria-current": "page" }}
                  >
                    <Icone aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* La déconnexion vit dans le Profil. */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Profil"
              className="data-[active=true]:font-bold"
            >
              <Link to="/profil" activeProps={{ "data-active": true, "aria-current": "page" }}>
                <Avatar className="size-7 rounded-full">
                  <AvatarFallback className="rounded-full bg-(--surface-3) text-xs font-bold">
                    {initiales(email)}
                  </AvatarFallback>
                </Avatar>
                <span>Profil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
