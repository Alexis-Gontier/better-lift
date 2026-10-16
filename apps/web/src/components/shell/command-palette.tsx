import { useNavigate } from "@tanstack/react-router";
import { CalendarPlus, FileUp, type LucideIcon, Plus, Scale, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { FileRouteTypes } from "@/routeTree.gen";
import { NAV_GROUPS } from "./nav";

type To = FileRouteTypes["to"];

const ACTIONS: { label: string; to: To; icon: LucideIcon }[] = [
  { label: "Nouvelle routine", to: "/routines/new", icon: Plus },
  { label: "Planifier une routine", to: "/planning", icon: CalendarPlus },
  { label: "Noter mon poids", to: "/body", icon: Scale },
  { label: "Importer depuis Hevy", to: "/settings/data", icon: FileUp },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl K (Cmd K sur Mac) ouvre la recherche, même sans bouton visible.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(to: To) {
    setPaletteOpen(false);
    navigate({ to });
  }

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      title="Recherche"
      description="Aller à une page ou lancer une action"
    >
      <CommandInput placeholder="Rechercher une page, une action…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Aller à">
          {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
            <CommandItem key={item.to} onSelect={() => go(item.to)}>
              <item.icon /> {item.title}
            </CommandItem>
          ))}
          <CommandItem onSelect={() => go("/settings/account")}>
            <Settings /> Paramètres
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {ACTIONS.map((a) => (
            <CommandItem key={a.label} onSelect={() => go(a.to)}>
              <a.icon /> {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
