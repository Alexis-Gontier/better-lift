import { Link, useRouteContext } from "@tanstack/react-router";
import {
  ChevronsUpDown,
  Dumbbell,
  History,
  ListChecks,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDeconnexion } from "@/lib/deconnexion";
import { OUVRIR_PALETTE } from "./palette";

const ENTREES = [
  { to: "/seances", label: "Séances", icone: History },
  { to: "/routines", label: "Routines", icone: ListChecks },
  { to: "/exercices", label: "Exercices", icone: Dumbbell },
  { to: "/parametres", label: "Paramètres", icone: Settings },
] as const;

/** Deux lettres tirées de l'adresse : « alexis.gontier » → « AG ». */
function initiales(email: string) {
  const [a = "", b = ""] = email.split("@")[0]?.split(/[._-]/) ?? [];
  return (a.charAt(0) + (b.charAt(0) || a.charAt(1))).toUpperCase() || "?";
}

export function NavLaterale() {
  const seDeconnecter = useDeconnexion();
  const email = useRouteContext({ strict: false }).auth?.session?.user.email ?? "";

  return (
    <Sidebar variant="inset" collapsible="none" aria-label="Navigation principale">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                {/* La marque est un aplat : c'est l'unique pastille lime permanente. */}
                <span aria-hidden="true" className="size-6 shrink-0 rounded-md bg-primary" />
                <span className="text-sm font-semibold tracking-tight text-(--ink)">
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
                <SidebarMenuButton asChild tooltip={label}>
                  {/* Les filtres de l'URL (`?groupe=…`) ne doivent pas éteindre l'entrée. */}
                  <Link
                    to={to}
                    activeOptions={{ includeSearch: false }}
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip="Compte">
                  <Avatar className="size-7 rounded-md">
                    <AvatarFallback className="rounded-md bg-(--surface-3) text-xs">
                      {initiales(email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{email || "Compte"}</span>
                  <ChevronsUpDown aria-hidden="true" className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="min-w-56">
                <DropdownMenuLabel className="truncate font-normal text-(--ink-subtle)">
                  {email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/parametres">
                    <Settings aria-hidden="true" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={seDeconnecter}>
                  <LogOut aria-hidden="true" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
