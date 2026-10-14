import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/** Ouvre la palette depuis un bouton : même chemin que `Cmd+K`, sans état partagé. */
export const OPEN_PALETTE = "better-lift:ouvrir-palette";

// Les destinations de la barre latérale (D134). Exercices, routines et séances
// s'ajoutent à la palette avec leurs lots.
const PAGES = [
  { to: "/", label: "Accueil" },
  { to: "/sessions", label: "Séances" },
  { to: "/routines", label: "Routines" },
  { to: "/exercises", label: "Exercices" },
  { to: "/profile", label: "Profil" },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    const openPalette = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    document.addEventListener(OPEN_PALETTE, openPalette);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener(OPEN_PALETTE, openPalette);
    };
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Palette de commandes"
      description="Aller à une page"
      // La palette flotte : bordure et ombre dure du Neobrutalism (D193), sur un voile.
      className="border-2 border-border bg-secondary-background shadow-shadow"
      overlayClassName="bg-overlay"
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
  );
}
