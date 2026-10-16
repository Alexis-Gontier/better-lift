import { Link, useNavigate } from "@tanstack/react-router";
import { Keyboard, LogOut, Settings } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { mockUser } from "@/mocks/user";
import { useShellDialogs } from "./shell-dialogs";

/** Contenu partagé par le pied de la sidebar et l'avatar du header. */
export function UserMenuItems() {
  const navigate = useNavigate();
  const { setHelpOpen } = useShellDialogs();
  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="font-medium">{mockUser.name}</div>
        <div className="text-muted-foreground text-xs">{mockUser.email}</div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/settings/account">
          <Settings /> Paramètres
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => setHelpOpen(true)}>
        <Keyboard /> Raccourcis clavier
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => navigate({ to: "/login" })}>
        <LogOut /> Se déconnecter
      </DropdownMenuItem>
    </>
  );
}
