import { Link } from "@tanstack/react-router";
import { LogOut, Search, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useDeconnexion } from "@/components/use-deconnexion";
import { auth } from "@/lib/auth";
import { initials } from "@/lib/format";
import { AppBreadcrumb } from "./app-breadcrumb";

function AccountMenu() {
  const deconnecter = useDeconnexion();
  // La garde de `_app` assure qu'une session est là.
  const user = auth.session?.user;
  const nom = user?.name ?? "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Mon compte">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials(nom)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium text-foreground">{nom}</span>
          <span className="font-normal text-muted-foreground text-xs">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings /> Paramètres
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void deconnecter()}>
            <LogOut /> Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Repli de la sidebar et fil d'Ariane, recherche au centre, compte à droite. La recherche suit la
 * largeur de l'en-tête (`cqw`) ; sous 42 rem elle laisse place à une loupe à côté du compte, et
 * le raccourci Ctrl K ne s'affiche qu'au large.
 */
export function SiteHeader({ onSearch }: { onSearch: () => void }) {
  return (
    // Un conteneur ne s'interroge pas lui-même : la mise en page vit dans le div intérieur. En
    // flex sous le seuil (le fil d'Ariane prend toute la place), en grille au-dessus.
    <header className="@container/header sticky top-0 z-10 h-12 shrink-0 border-b bg-background px-4">
      <div className="@[42rem]/header:grid flex h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="-ml-1 shrink-0 text-muted-foreground hover:text-foreground" />
          <AppBreadcrumb />
        </div>
        <Button
          variant="outline"
          className="@[42rem]/header:flex hidden w-[clamp(9rem,28cqw,18rem)] justify-start font-normal text-muted-foreground"
          onClick={onSearch}
        >
          <Search />
          Rechercher…
          <KbdGroup className="@[52rem]/header:flex ml-auto hidden">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
        <div className="col-start-3 flex shrink-0 items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="@[42rem]/header:hidden text-muted-foreground"
            aria-label="Rechercher"
            onClick={onSearch}
          >
            <Search />
          </Button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
