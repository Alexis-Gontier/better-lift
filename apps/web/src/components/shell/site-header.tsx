import { Keyboard, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { mockUser } from "@/mocks/user";
import { AppBreadcrumb } from "./app-breadcrumb";
import { useShellDialogs } from "./shell-dialogs";
import { ThemeToggle } from "./theme-toggle";
import { UserMenuItems } from "./user-menu";

export function SiteHeader() {
  const { setPaletteOpen, setHelpOpen } = useShellDialogs();
  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger />
        <AppBreadcrumb />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full max-w-64 justify-between font-normal text-muted-foreground"
        onClick={() => setPaletteOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search /> Rechercher partout…
        </span>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Raccourcis clavier"
              onClick={() => setHelpOpen(true)}
            >
              <Keyboard />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Raccourcis clavier</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Compte">
              <Avatar className="size-8 border">
                <AvatarFallback className="text-xs">{mockUser.initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <UserMenuItems />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
