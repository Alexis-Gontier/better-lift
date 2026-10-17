import { Link } from "@tanstack/react-router";
import { LogOut, Palette, Search, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { APPEARANCES, type Appearance, setAppearance, useAppearance } from "@/lib/theme";
import { initials, mockAccount } from "@/mocks/account";
import { AppBreadcrumb } from "./app-breadcrumb";

function AccountMenu() {
  const appearance = useAppearance();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Mon compte">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials(mockAccount.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium text-foreground">{mockAccount.name}</span>
          <span className="font-normal text-muted-foreground text-xs">{mockAccount.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings /> Paramètres
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Palette /> Thème
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={appearance}
                onValueChange={(v) => setAppearance(v as Appearance)}
              >
                {APPEARANCES.map((a) => (
                  <DropdownMenuRadioItem key={a.value} value={a.value}>
                    {a.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/login">
            <LogOut /> Se déconnecter
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Repli de la sidebar et fil d'Ariane, recherche au centre, compte à droite. */
export function SiteHeader({ onSearch }: { onSearch: () => void }) {
  return (
    <header className="sticky top-0 z-10 grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <AppBreadcrumb />
      </div>
      <Button
        variant="outline"
        className="w-72 justify-start font-normal text-muted-foreground"
        onClick={onSearch}
      >
        <Search />
        Rechercher…
        <KbdGroup className="ml-auto">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <div className="flex justify-end">
        <AccountMenu />
      </div>
    </header>
  );
}
