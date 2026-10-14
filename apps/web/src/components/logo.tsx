import { cn } from "cn";
import { Dumbbell } from "lucide-react";

/**
 * Le logo : l'haltère Lucide redressée de 45°, en encre sur l'aplat d'action orange,
 * comme sur le mobile — le même dessin que le bouton central du mobile.
 * C'est l'unique pastille de couleur permanente. Décoratif : le nom « better-lift »
 * l'accompagne toujours.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-base border-2 border-border bg-primary text-primary-foreground",
        className,
      )}
    >
      <Dumbbell className="size-[62%] rotate-45" strokeWidth={2.25} />
    </span>
  );
}
