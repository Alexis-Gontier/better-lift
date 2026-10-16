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

/** Chargement : la même grille que la page, en blocs. */
export function HomeSkeleton() {
  return (
    <>
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {["a", "b", "c", "d"].map((k) => (
          <Skeleton key={k} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-80 rounded-xl md:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-56 rounded-xl md:col-span-3" />
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
