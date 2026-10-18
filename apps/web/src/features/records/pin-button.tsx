import { Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applyPin, MAX_PINS, usePins } from "@/mocks/pins";

/** La punaise d'un exercice (D276) : sur la fiche et sur chaque carte de l'Accueil. */
export function PinButton({ slug, className }: { slug: string; className?: string }) {
  const { slugs, isDefault } = usePins();
  const pinned = !isDefault && slugs.includes(slug);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={pinned}
      aria-label={pinned ? "Désépingler de l'accueil" : "Épingler à l'accueil"}
      title={pinned ? "Désépingler de l'accueil" : "Épingler à l'accueil"}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Par défaut, rien n'est encore choisi : la première punaise part d'une liste vide.
        const result = applyPin(isDefault ? [] : slugs, slug);
        if (result === "full")
          toast.error(`${MAX_PINS} exercices au plus : désépinglez-en un d'abord`);
        else toast(result === "pinned" ? "Épinglé à l'accueil" : "Désépinglé de l'accueil");
      }}
    >
      <Pin className={cn(pinned && "fill-current text-foreground")} />
    </Button>
  );
}
