import { LIBELLE_GROUPE } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { exerciceQuery, historiqueQuery } from "@/lib/exercices";
import { formatLoad } from "@/lib/format";

/**
 * La fiche d'un exercice sans quitter la page (D262) : l'animation, les muscles et la dernière
 * fois. « Fiche complète » mène à la page de l'exercice ; une routine modifiée demande alors s'il
 * faut l'enregistrer (D261). Commune aux routines et à l'historique.
 */
export function ExerciseQuickView({
  slug,
  onOpenChange,
}: {
  /** L'exercice montré ; `null` : la fenêtre est fermée. */
  slug: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={slug !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">{slug && <Contenu slug={slug} />}</DialogContent>
    </Dialog>
  );
}

function Contenu({ slug }: { slug: string }) {
  const exercice = useQuery(exerciceQuery(slug));
  const historique = useQuery(historiqueQuery(slug));
  const e = exercice.data;
  if (!e)
    return (
      <>
        <DialogHeader>
          <DialogTitle>
            {exercice.isError ? "Cet exercice n'a pas pu se charger" : "Chargement…"}
          </DialogTitle>
          <DialogDescription className="sr-only">Fiche de l'exercice</DialogDescription>
        </DialogHeader>
        {exercice.isPending && <Skeleton className="aspect-square w-full sm:w-1/2" />}
      </>
    );
  // La dernière séance où il figure : ses séries faites.
  const derniere = historique.data?.[0]?.series.filter((s) => s.faite) ?? [];
  return (
    <>
      <DialogHeader>
        <DialogTitle>{e.nom}</DialogTitle>
        <DialogDescription>
          {LIBELLE_GROUPE[e.groupe]} · {e.equipement}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <ExerciseGif name={e.nom} src={e.gif} />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">Muscles</span>
            <div className="mx-auto w-full max-w-40">
              <BodyMap primary={[e.cible]} secondary={e.secondaires} />
            </div>
            {e.secondaires.length > 0 && (
              <span className="text-muted-foreground text-xs">
                Aussi : {e.secondaires.join(", ")}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Dernière fois</span>
            <span className="text-sm tabular-nums">
              {historique.isPending
                ? "…"
                : derniere.length > 0
                  ? derniere.map((s) => `${formatLoad(s.chargeKg)} × ${s.reps ?? "—"}`).join(" · ")
                  : "Jamais fait"}
            </span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button asChild variant="outline">
          <Link to="/exercises/$slug" params={{ slug: e.slug }}>
            Fiche complète <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
      </DialogFooter>
    </>
  );
}
