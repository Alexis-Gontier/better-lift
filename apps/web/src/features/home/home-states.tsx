import { Link } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

/** Chargement : la ligne de tête, puis une grille de cartes. */
export function HomeSkeleton() {
  return (
    <>
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-3 @xl:grid-cols-2 @3xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </>
  );
}

/** Vide : un compte qui n'a encore rien enregistré. */
export function HomeEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Dumbbell />
        </EmptyMedia>
        <EmptyTitle>Pas encore de séance</EmptyTitle>
        <EmptyDescription>
          Créez une routine pour préparer votre première séance, ou reprenez votre historique depuis
          Hevy.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button asChild>
          <Link to="/routines/new">Créer une routine</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/settings/data">Importer depuis Hevy</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
