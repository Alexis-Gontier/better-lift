import { Link, useRouteContext } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/lib/sign-out";
import { displayName, initials } from "./account-name";

/**
 * La barre latérale de shadcn, vide pour l'instant : le compte seul, en pied.
 * La navigation viendra quand le layout sera dessiné.
 */
export function SideNav() {
  const email = useRouteContext({ from: "__root__" }).auth.session?.user.email ?? "";

  return (
    <Sidebar>
      <SidebarContent />
      <SidebarFooter>
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
              <Avatar className="size-8 rounded-base">
                <AvatarFallback className="rounded-base">{initials(email)}</AvatarFallback>
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
