import { Link, useRouteContext } from "@tanstack/react-router";
import {
  Dumbbell,
  History,
  House,
  ListChecks,
  LogOut,
  MoreHorizontal,
  Search,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useDeconnexion } from "@/lib/deconnexion";
import { initiales, nomAffiche } from "./nom-compte";
import { OUVRIR_PALETTE } from "./palette";

// L'Accueil seul en tête (D197), puis les groupes (D155) ; le Profil vit dans le pied (D156).
const GROUPES = [
  { libelle: null, entrees: [{ to: "/", label: "Accueil", icone: House }] },
  {
    libelle: "Entraînement",
    entrees: [
      { to: "/sessions", label: "Séances", icone: History },
      { to: "/routines", label: "Routines", icone: ListChecks },
    ],
  },
  { libelle: "Catalogue", entrees: [{ to: "/exercises", label: "Exercices", icone: Dumbbell }] },
] as const;

export function NavLaterale() {
  const email = useRouteContext({ strict: false }).auth?.session?.user.email ?? "";

  return (
    // Non repliable : shadcn rend alors un simple bloc, sans le filet de la variante
    // `sidebar` — il est posé ici (D154).
    <Sidebar collapsible="none" aria-label="Navigation principale" className="border-r">
      <SidebarHeader className="gap-3">
        <Link to="/" className="flex items-center gap-2 px-2 pt-1.5">
          <Logo />
          <span className="text-base font-extrabold tracking-tight text-foreground">
            better-lift
          </span>
        </Link>
        {/* Un champ en apparence (D155), un bouton en fait : il ouvre la palette. */}
        <button
          type="button"
          onClick={() => document.dispatchEvent(new Event(OUVRIR_PALETTE))}
          className="flex h-8 items-center gap-2 rounded-md border border-border bg-secondary-background px-2.5 text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-3.5" aria-hidden="true" />
          Rechercher
          <kbd className="ml-auto rounded border border-border px-1 text-[11px]">Ctrl K</kbd>
        </button>
      </SidebarHeader>

      <SidebarContent>
        {GROUPES.map(({ libelle, entrees }) => (
          <SidebarGroup key={libelle ?? "accueil"} className="py-1">
            {libelle ? <SidebarGroupLabel>{libelle}</SidebarGroupLabel> : null}
            <SidebarMenu>
              {entrees.map(({ to, label, icone: Icone }) => (
                <SidebarMenuItem key={to}>
                  {/* `isActive` passe par le `data-active` du lien actif : la route décide. */}
                  <SidebarMenuButton asChild className="h-8 data-[active=true]:font-bold">
                    {/* Les filtres de l'URL ne doivent pas éteindre l'entrée ; sans `exact`,
                        `/` resterait actif sur toutes les pages. */}
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
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <NavUser email={email} />
      </SidebarFooter>
    </Sidebar>
  );
}

/** Le pied de barre (D156) : le compte, et son menu Profil / Se déconnecter. */
function NavUser({ email }: { email: string }) {
  const seDeconnecter = useDeconnexion();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <Avatar className="size-7 rounded-full">
                <AvatarFallback className="rounded-full bg-muted text-xs font-bold">
                  {initiales(email)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                {nomAffiche(email)}
              </span>
              <MoreHorizontal className="ml-auto" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width)"
          >
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserRound aria-hidden="true" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void seDeconnecter()}>
              <LogOut aria-hidden="true" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
