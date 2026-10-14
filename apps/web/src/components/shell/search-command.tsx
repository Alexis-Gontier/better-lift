import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Les destinations ; exercices, routines et séances s'y ajouteront.
const PAGES = [
  { to: "/", label: "Accueil" },
  { to: "/sessions", label: "Séances" },
  { to: "/routines", label: "Routines" },
  { to: "/exercises", label: "Exercices" },
  { to: "/profile", label: "Profil" },
] as const;

/** La recherche de la barre latérale : un champ en apparence, qui ouvre la palette (aussi par Ctrl K). */
export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => setOpen(true)}
            className="border-border bg-secondary-background text-muted-foreground hover:text-foreground"
          >
            <Search aria-hidden="true" />
            <span>Rechercher</span>
            <Kbd className="ml-auto">Ctrl K</Kbd>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Rechercher"
        description="Aller à une page"
      >
        <CommandInput placeholder="Aller à…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map(({ to, label }) => (
              <CommandItem
                key={to}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to });
                }}
              >
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </SidebarGroup>
  );
}
