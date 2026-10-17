import { Link } from "@tanstack/react-router";
import { ChevronRight, GripVertical, ListChecks, Plus } from "lucide-react";
import { BodyMap } from "@/components/body-map";
import { DetailHeader, listLinkProps } from "@/components/list-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDaysAgo, formatMinutes, plural } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { bodyMuscles, daysSince, estimateMinutes } from "@/mocks/routine-stats";
import { useFolders, useRoutines } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";

/**
 * Le détail décide seul de son défilement (D255) : un panneau qui n'est pas l'éditeur pose sa
 * propre `ScrollArea` sur toute la hauteur.
 */
function PaneScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollArea className="-mx-6 -mt-6 -mb-6 min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
      <div className="flex flex-col gap-6 p-6 pb-24 *:shrink-0">{children}</div>
    </ScrollArea>
  );
}

/** Jamais faite d'abord, puis de la plus ancienne à la plus récente. */
function oldestFirst(routines: readonly MockRoutine[]): MockRoutine[] {
  const age = (r: MockRoutine) => (r.lastDone ? daysSince(r.lastDone, TODAY) : Number.MAX_VALUE);
  return [...routines].sort((a, b) => age(b) - age(a));
}

/** Les routines qu'on n'a pas faites depuis le plus longtemps : de quoi choisir la prochaine. */
function Stale({ routines }: { routines: MockRoutine[] }) {
  return (
    <Card size="sm" className="gap-0 pb-0">
      <CardHeader className="pb-3">
        <CardTitle>Pas faites depuis longtemps</CardTitle>
        <CardDescription>La plus ancienne en premier.</CardDescription>
      </CardHeader>
      {oldestFirst(routines)
        .slice(0, 3)
        .map((r) => (
          <div key={r.id}>
            <Separator />
            <Link
              to="/routines/$id"
              params={{ id: r.id }}
              {...listLinkProps}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{r.name}</span>
                <span className="truncate text-muted-foreground text-xs">
                  {r.folder || "Sans dossier"} · ~{formatMinutes(estimateMinutes(r.exercises))}
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground text-sm">
                {formatDaysAgo(r.lastDone ? daysSince(r.lastDone, TODAY) : null)}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </div>
        ))}
    </Card>
  );
}

/** Tout ce que les routines font travailler, d'un coup d'œil : les trous se voient. */
function Coverage({ routines }: { routines: MockRoutine[] }) {
  const { primary, secondary } = bodyMuscles(
    routines.flatMap((r) => r.exercises),
    exerciseBySlug,
  );
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Muscles couverts</CardTitle>
        <CardDescription>Foncé : travaillé en principal dans au moins une routine.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mx-auto w-full max-w-44">
          <BodyMap primary={primary} secondary={secondary} />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * `/routines` sans routine ouverte (D260) : une vue d'ensemble plutôt qu'une consigne. Elle aide
 * à choisir la prochaine routine et montre ce que l'ensemble couvre.
 */
export function RoutinesHome() {
  const routines = useRoutines();
  const folders = useFolders();
  if (routines.length === 0) return <RoutinesOnboarding />;
  return (
    <PaneScroll>
      <DetailHeader
        title="Vos routines"
        subtitle={`${plural(routines.length, "routine")} · ${plural(folders.length, "dossier")}`}
      />
      <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Stale routines={routines} />
        <Coverage routines={routines} />
      </div>
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <GripVertical className="size-4 shrink-0" />
        Glissez une routine par sa poignée sur un dossier pour la ranger.
      </p>
    </PaneScroll>
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

/** La vue d'ensemble pendant le chargement : sa tête et ses deux cartes. */
export function RoutinesHomeSkeleton() {
  return (
    <PaneScroll>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>
      <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </PaneScroll>
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
