import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function Palette() {
  const [ouverte, setOuverte] = useState(false);

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOuverte((o) => !o);
      }
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, []);

  return (
    <CommandDialog
      open={ouverte}
      onOpenChange={setOuverte}
      title="Palette de commandes"
      description="Rechercher un exercice ou lancer une action"
      // Seul élément élevé de l'interface (D27) : flou, filet et ombre portée du
      // registre flottant, jamais utilisés par les panneaux permanents. --scrim,
      // --float-bg, --float-line et --float-shadow ne sont pas exposés à Tailwind
      // (@theme inline de globals.css ne couvre que surfaces/filets/encre/accent),
      // d'où la syntaxe `(--var)` plutôt que des classes bg-float-bg inexistantes.
      className="border-(--float-line) bg-(--float-bg) shadow-(--float-shadow) backdrop-blur-[20px]"
      overlayClassName="bg-(--scrim)"
    >
      <CommandInput placeholder="Rechercher un exercice, une routine, une action…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>Démarrer une séance libre</CommandItem>
          <CommandItem>Créer une routine</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
