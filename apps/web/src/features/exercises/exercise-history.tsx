"use client";

import { TrophyIcon } from "lucide-react";
import Link from "next/link";

import { useExerciseHistory } from "@better-lift/api-client";
import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";
import { cn } from "@better-lift/ui/lib/utils";
import { type ExerciseHistoryEntry } from "@better-lift/validators";

import { Distance, Weight } from "@/features/account/units";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { SET_TYPE_SHORT, SET_TYPE_TONE } from "@/features/routines/labels";
import { formatSetDuration } from "@/features/workouts/labels";
import { apiClient } from "@/lib/api";

/** Une série, écrite comme on la lit à voix haute : « 100 kg × 5 ». */
function SetLine({ set, index }: { set: ExerciseHistoryEntry["sets"][number]; index: number }) {
  const parts: React.ReactNode[] = [];

  if (set.weightKg !== null) {
    parts.push(<Weight key="w" value={set.weightKg} />);
  }

  if (set.reps !== null) {
    parts.push(<span key="r">{`${parts.length > 0 ? " × " : ""}${set.reps} reps`}</span>);
  }

  if (set.durationSec !== null) {
    parts.push(
      <span key="d">{`${parts.length > 0 ? " · " : ""}${formatSetDuration(set.durationSec)}`}</span>,
    );
  }

  if (set.distanceM !== null) {
    parts.push(
      <span key="m">
        {parts.length > 0 ? " · " : ""}
        <Distance value={set.distanceM} />
      </span>,
    );
  }

  return (
    <li
      /*
        Une série non validée reste affichée — elle dit ce qui était prévu et
        n'a pas été fait — mais en retrait : elle ne compte ni dans le volume ni
        dans les records (doc 03).
      */
      className={cn(
        "flex items-center gap-2 text-sm",
        !set.completed && "text-muted-foreground/50",
      )}
    >
      <span className={cn("w-5 shrink-0 font-mono text-xs", SET_TYPE_TONE[set.type])}>
        {SET_TYPE_SHORT[set.type] || index + 1}
      </span>
      <span className="tabular-nums">{parts.length > 0 ? parts : "—"}</span>
      {set.rpe !== null && <span className="text-xs text-muted-foreground">RPE {set.rpe}</span>}
      {set.isPr && (
        <>
          <TrophyIcon className="size-3.5" aria-hidden />
          <span className="sr-only">Record personnel</span>
        </>
      )}
    </li>
  );
}

/**
 * Historique personnel sur un exercice (doc 05, § Fiche exercice).
 *
 * Une entrée par passage en séance, antéchronologique : c'est ainsi qu'on lit
 * sa progression — « la semaine dernière, 100 × 5 » —, et c'est la forme que
 * sert l'API. Les pages s'empilent, elles ne se sautent pas : la pagination est
 * par curseur, il n'existe pas de « page 4 ».
 */
export function ExerciseHistory({ id }: { id: string }) {
  const locale = useProfileLocale();
  const intlLocale = locale === "en" ? "en-GB" : "fr-FR";
  const history = useExerciseHistory(apiClient, id);

  if (history.isPending) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (history.isError) {
    return null;
  }

  const entries = history.data.pages.flatMap((page) => page.data);
  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Historique</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cet exercice n’a encore été fait dans aucune séance.
          </p>
        ) : (
          entries.map((entry) => (
            <section key={entry.id} className="flex flex-col gap-1.5">
              <header className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="text-sm font-medium">
                  <Link href={`/workouts/${entry.workoutId}`} className="hover:underline">
                    {entry.workoutTitle}
                  </Link>
                </h3>
                <time className="text-xs text-muted-foreground" dateTime={entry.performedAt}>
                  {dateFormatter.format(new Date(entry.performedAt))}
                </time>
              </header>

              {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}

              {entry.sets.length === 0 ? (
                /* L'exercice a été ajouté à la séance puis laissé vide : le
                   dire vaut mieux qu'une section muette. */
                <p className="text-sm text-muted-foreground">Aucune série enregistrée.</p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {entry.sets.map((set, index) => (
                    <SetLine key={`${entry.id}-${set.position}`} set={set} index={index} />
                  ))}
                </ul>
              )}
            </section>
          ))
        )}

        {history.hasNextPage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            disabled={history.isFetchingNextPage}
            aria-busy={history.isFetchingNextPage}
            onClick={() => void history.fetchNextPage()}
          >
            {history.isFetchingNextPage && <Spinner data-icon="inline-start" />}
            Séances plus anciennes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
