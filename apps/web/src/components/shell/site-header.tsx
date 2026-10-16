import { Keyboard, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
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
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <AppBreadcrumb />
      </div>
      <Button
        variant="outline"
        className="w-full max-w-sm justify-between text-muted-foreground"
        onClick={() => setPaletteOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search /> Rechercher…
        </span>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <div className="flex flex-1 items-center justify-end gap-1">
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
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
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Compte">
              <Avatar className="size-8">
                <AvatarFallback>{mockUser.initials}</AvatarFallback>
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
