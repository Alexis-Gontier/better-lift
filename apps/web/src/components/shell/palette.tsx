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
export const OUVRIR_PALETTE = "better-lift:ouvrir-palette";

// Les destinations de la barre latérale (D134). Exercices, routines et séances
// s'ajoutent à la palette avec leurs lots.
const PAGES = [
  { to: "/", label: "Tableau de bord" },
  { to: "/seances", label: "Séances" },
  { to: "/routines", label: "Routines" },
  { to: "/exercices", label: "Exercices" },
  { to: "/profil", label: "Profil" },
] as const;

export function Palette() {
  const [ouverte, setOuverte] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOuverte((o) => !o);
      }
    }
    const ouvrir = () => setOuverte(true);
    document.addEventListener("keydown", surTouche);
    document.addEventListener(OUVRIR_PALETTE, ouvrir);
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.removeEventListener(OUVRIR_PALETTE, ouvrir);
    };
  }, []);

  return (
    <CommandDialog
      open={ouverte}
      onOpenChange={setOuverte}
      title="Palette de commandes"
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
                setOuverte(false);
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
