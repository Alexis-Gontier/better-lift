import { Link, useRouteContext } from "@tanstack/react-router";
import {
  ChevronsUpDown,
  Dumbbell,
  History,
  House,
  ListChecks,
  LogOut,
  UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { useSignOut } from "@/lib/sign-out";
import { displayName, initials } from "./account-name";

// Les pages, en une seule liste ; le Profil vit dans le menu du compte.
const PAGES = [
  { to: "/", label: "Accueil", icon: House },
  { to: "/sessions", label: "Séances", icon: History },
  { to: "/routines", label: "Routines", icon: ListChecks },
  { to: "/exercises", label: "Exercices", icon: Dumbbell },
] as const;

/** La barre latérale de shadcn : la place du titre en tête, les pages, le compte en pied. */
export function SideNav() {
  const email = useRouteContext({ from: "__root__" }).auth.session?.user.email ?? "";

  return (
    <Sidebar>
      {/* La place du titre de l'app et de son icône, à venir : même hauteur que le pied. */}
      <SidebarHeader className="h-16 border-b-2 border-sidebar-border" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {PAGES.map(({ to, label, icon: Icon }) => (
              <SidebarMenuItem key={to}>
                {/* La route décide de l'entrée active, par le `data-active` du lien. */}
                <SidebarMenuButton asChild className="h-10 gap-3 px-3 text-[15px]">
                  {/* Les filtres de l'URL n'éteignent pas l'entrée ; sans `exact`, `/`
                      resterait actif sur toutes les pages. */}
                  <Link
                    to={to}
                    activeOptions={{ includeSearch: false, exact: to === "/" }}
                    activeProps={{ "data-active": true, "aria-current": "page" }}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t-2 border-sidebar-border">
        <NavUser email={email} />
      </SidebarFooter>
    </Sidebar>
  );
}

/** Le compte (bloc `nav-user` de shadcn) : avatar, nom et adresse, menu Profil / Se déconnecter. */
function NavUser({ email }: { email: string }) {
  const signOut = useSignOut();
  const name = displayName(email);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar>
                <AvatarFallback>{initials(email)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
              {email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <UserRound aria-hidden="true" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void signOut()}>
                <LogOut aria-hidden="true" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
