import { Image, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Les médias d'un exercice, simulés : le wireframe n'a pas d'images. Au branchement, la
 * vignette sera l'image fixe déduite du GIF (`imageDe`, ~6 Ko) et la fiche montrera le GIF.
 * Mêmes dimensions que les vrais médias, pour juger la mise en page.
 */
export function ExerciseThumb({ name, className }: { name: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`Image : ${name}`}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
        className,
      )}
    >
      <Image className="size-4" />
    </div>
  );
}

/** L'animation de l'exercice, carrée comme les GIF du catalogue. */
export function ExerciseGif({ name, className }: { name: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`Animation : ${name}`}
      className={cn(
        "flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-background/70">
        <Play className="size-4" />
      </div>
      <span className="text-xs">Animation (GIF)</span>
    </div>
  );
}
