import { Link } from "@tanstack/react-router";
import { ListChecks, MousePointerClick, Plus } from "lucide-react";
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
import { useRoutines } from "@/mocks/routine-store";

/**
 * `/routines` sans routine ouverte (D260) : un état vide franc, qui dit quoi faire et porte la
 * création. Sans aucune routine, la première création prend le relais.
 */
export function RoutinesHome() {
  const routines = useRoutines();
  if (routines.length === 0) return <RoutinesOnboarding />;
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MousePointerClick />
        </EmptyMedia>
        <EmptyTitle>Aucune routine ouverte</EmptyTitle>
        <EmptyDescription>
          Choisissez-en une dans la liste pour la relire ou la modifier, ou créez-en une nouvelle.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link to="/routines/new" search>
            <Plus data-icon="inline-start" /> Nouvelle routine
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

const STEPS = [
  { title: "Nommez-la", text: "« Push », « Haut du corps »… le nom qu'on choisit en salle." },
  { title: "Ajoutez les exercices", text: "Depuis le catalogue, dans l'ordre de la séance." },
  { title: "Réglez séries et repos", text: "Charges et répétitions visées, repos entre séries." },
];

/** Aucune routine (`vide`) : le panneau de droite explique la première création. */
export function RoutinesOnboarding() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListChecks />
        </EmptyMedia>
        <EmptyTitle>Créez votre première routine</EmptyTitle>
        <EmptyDescription>
          Une routine prépare une séance : on la lance ensuite depuis le téléphone.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-md">
        <ol className="flex w-full flex-col gap-3 text-left">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-xs tabular-nums">
                {i + 1}
              </span>
              <span className="flex flex-col">
                <span className="font-medium text-sm">{s.title}</span>
                <span className="text-muted-foreground text-sm">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <Button asChild>
          <Link to="/routines/new" search>
            <Plus data-icon="inline-start" /> Nouvelle routine
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/** L'éditeur pendant le chargement : le nom, les cartes d'exercice et la colonne de droite. */
export function RoutinePaneSkeleton() {
  return (
    <>
      <div className="-mx-6 -mt-6 flex items-center justify-between border-b px-6 pt-6 pb-4">
        <Skeleton className="h-11 w-48 rounded-lg" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <div className="grid min-h-0 flex-1 gap-6 overflow-hidden @3xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24 rounded" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
        <div className="hidden flex-col gap-2 @3xl:flex">
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="mt-2 h-40 rounded-xl" />
        </div>
      </div>
    </>
  );
}
