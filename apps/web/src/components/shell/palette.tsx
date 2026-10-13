import { useQuery } from "@tanstack/react-query";
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
import { optionsRoutines } from "@/features/routines/requetes";

/** Ouvre la palette depuis un bouton : même chemin que `Cmd+K`, sans état partagé. */
export const OUVRIR_PALETTE = "better-lift:ouvrir-palette";

// Les destinations de la barre latérale (D134). Les routines et l'action « Nouvelle
// routine » s'y ajoutent (D191) ; les exercices se cherchent dans leur page.
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
  // La liste ne part qu'à l'ouverture, et reprend le cache de la page Routines.
  const routines = useQuery({ ...optionsRoutines(), enabled: ouverte });

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
      description="Aller à une page ou une routine"
    >
      <CommandInput placeholder="Aller à… ou chercher une routine" />
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
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOuverte(false);
              navigate({ to: "/routines/nouvelle" });
            }}
          >
            Nouvelle routine
          </CommandItem>
        </CommandGroup>
        {routines.data?.length ? (
          <CommandGroup heading="Routines">
            {routines.data.map((r) => (
              <CommandItem
                key={r.id}
                // cmdk filtre sur `value` : le nom, l'id pour départager deux homonymes.
                value={`${r.nom} ${r.id}`}
                onSelect={() => {
                  setOuverte(false);
                  navigate({ to: "/routines/$id", params: { id: r.id } });
                }}
              >
                {r.nom}
                <span className="ml-auto text-xs text-muted-foreground">
                  {r.nbExercices} exercices
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
