"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { useWorkouts } from "@better-lift/api-client";
import { Button } from "@better-lift/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { Weight } from "@/features/account/units";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { useProfileTimezone } from "@/features/account/use-profile-timezone";
import { formatDuration } from "@/features/workouts/labels";
import { apiClient } from "@/lib/api";

function RecentWorkoutsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Séances récentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Les cinq dernières séances.
 *
 * Réutilise `useWorkouts`, l'infinie de l'historique, plutôt qu'une route
 * dédiée : la première page suffit, et partager la clé de cache avec
 * l'historique évite de recharger la même chose en arrivant dessus.
 */
export function RecentWorkouts() {
  const locale = useProfileLocale();
  const timeZone = useProfileTimezone();
  const intlLocale = locale === "en" ? "en-GB" : "fr-FR";
  const workouts = useWorkouts(apiClient, { limit: 5 });

  if (workouts.isPending) {
    return <RecentWorkoutsSkeleton />;
  }

  if (workouts.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Séances récentes</CardTitle>
          <CardDescription>L’historique n’a pas pu être chargé.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const items = workouts.data?.pages[0]?.data ?? [];

  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    // Le fuseau du **profil**, pas celui du navigateur (doc 05) : une séance du
    // soir changerait sinon de jour selon l'endroit d'où on la consulte.
    timeZone,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Séances récentes</CardTitle>
        {items.length > 0 && (
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/workouts">
                Tout l’historique
                <ChevronRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune séance enregistrée pour l’instant.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((workout) => (
              <li key={workout.id}>
                <Link
                  href={`/workouts/${workout.id}`}
                  className="flex items-center gap-3 rounded-md py-2.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{workout.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <time dateTime={workout.startedAt}>
                        {dateFormatter.format(new Date(workout.startedAt))}
                      </time>
                      {workout.durationSec > 0 && <> · {formatDuration(workout.durationSec)}</>}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    <Weight value={workout.totalVolumeKg} />
                  </span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
