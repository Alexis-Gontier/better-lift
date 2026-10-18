import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Pin } from "lucide-react";
import { BodyMap } from "@/components/body-map";
import { ExerciseGif } from "@/components/exercise-media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatLoad } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { lastSets } from "@/mocks/generated-workouts";

/**
 * La fiche d'un exercice sans quitter la routine (D262) : l'animation, les muscles, la note et la
 * dernière fois. « Fiche complète » mène à la page de l'exercice ; une routine modifiée demande
 * alors s'il faut l'enregistrer (D261).
 */
export function ExerciseQuickView({
  slug,
  onOpenChange,
}: {
  /** L'exercice montré ; `null` : la fenêtre est fermée. */
  slug: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const exercise = slug ? exerciseBySlug(slug) : undefined;
  const last = slug ? lastSets(slug) : undefined;
  return (
    <Dialog open={slug !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {exercise && (
          <>
            <DialogHeader>
              <DialogTitle>{exercise.name}</DialogTitle>
              <DialogDescription>
                {exercise.muscle} · {exercise.equipment}
              </DialogDescription>
            </DialogHeader>
            {exercise.note && (
              <p className="flex gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Pin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {exercise.note}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <ExerciseGif name={exercise.name} />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-muted-foreground text-xs">Muscles</span>
                  <div className="mx-auto w-full max-w-40">
                    <BodyMap primary={[exercise.muscle]} secondary={exercise.secondary} />
                  </div>
                  {exercise.secondary && exercise.secondary.length > 0 && (
                    <span className="text-muted-foreground text-xs">
                      Aussi : {exercise.secondary.join(", ")}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Dernière fois</span>
                  <span className="text-sm tabular-nums">
                    {last && last.length > 0
                      ? last.map(([kg, reps]) => `${formatLoad(kg)} × ${reps}`).join(" · ")
                      : "Jamais fait"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button asChild variant="outline">
                <Link to="/exercises/$slug" params={{ slug: exercise.slug }}>
                  Fiche complète <ArrowUpRight data-icon="inline-end" />
                </Link>
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
