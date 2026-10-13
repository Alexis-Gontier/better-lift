import { cn } from "cn";
import { Dumbbell } from "lucide-react";

/**
 * Le logo : l'haltère Lucide redressée de 45°, sur l'aplat `primary` du thème
 * (D192) — le même dessin que sur le mobile. Décoratif : le nom « better-lift » l'accompagne toujours.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-[22%] bg-primary text-primary-foreground",
        className,
      )}
    >
      <Dumbbell className="size-[62%] rotate-45" strokeWidth={2.25} />
    </span>
  );
}
