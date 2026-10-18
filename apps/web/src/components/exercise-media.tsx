import { Image, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Les médias d'un exercice : la vignette est l'image fixe déduite du GIF (`imageDe`, ~6 Ko), la
 * fiche montre le GIF. Fond blanc dans les deux thèmes : les images du catalogue sont sur blanc.
 * Sans média, un repli de mêmes dimensions.
 */
export function ExerciseThumb({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const cadre = cn("size-10 shrink-0 rounded-lg", className);
  if (src)
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn(cadre, "border bg-white object-contain")}
      />
    );
  return (
    <div
      role="img"
      aria-label={`Pas d'image : ${name}`}
      className={cn(cadre, "flex items-center justify-center bg-muted text-muted-foreground")}
    >
      <Image className="size-4" />
    </div>
  );
}

/** L'animation de l'exercice, carrée comme les GIF du catalogue. */
export function ExerciseGif({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const cadre = cn("aspect-square w-full rounded-lg", className);
  if (src)
    return (
      <img
        src={src}
        alt={`Animation : ${name}`}
        className={cn(cadre, "border bg-white object-contain")}
      />
    );
  return (
    <div
      role="img"
      aria-label={`Pas d'animation : ${name}`}
      className={cn(
        cadre,
        "flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground",
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-background/70">
        <Play className="size-4" />
      </div>
      <span className="text-xs">Pas d'animation</span>
    </div>
  );
}
