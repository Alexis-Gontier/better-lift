"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@better-lift/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import { type WorkoutSummary } from "@better-lift/validators";

import { formatDuration, plural } from "./labels";
import { Weight } from "@/features/account/units";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { useProfileTimezone } from "@/features/account/use-profile-timezone";

/**
 * Carte d'historique. Elle se rend **sans charger la structure de la séance** :
 * tous les chiffres affichés ici sont dénormalisés en base et servis par la
 * liste (doc 03, §3). Ouvrir vingt cartes ne parcourt aucune série.
 */
export function WorkoutCard({ workout }: { workout: WorkoutSummary }) {
  const locale = useProfileLocale();
  const timeZone = useProfileTimezone();

  const when = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone,
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(workout.startedAt)),
    [workout.startedAt, locale, timeZone],
  );

  /**
   * Une séance sans fin est un enregistrement en cours — le mobile n'envoie
   * `endedAt` qu'à la fin (doc 06). Elle apparaît quand même dans l'historique :
   * la masquer donnerait l'impression d'une séance perdue.
   */
  const ongoing = workout.endedAt === null;

  return (
    // `Card` rend un `<div>` et n'accepte pas `asChild` : l'élément de liste
    // reste au-dessus. Le mettre à l'intérieur casserait la sémantique du
    // `<ul>` parent, qui n'admet que des `<li>` en enfant direct.
    <li>
      <Card size="sm">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>
              <Link
                href={`/workouts/${workout.id}`}
                className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {workout.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground first-letter:uppercase">{when}</p>
          </div>

          {workout.prCount > 0 && (
            /**
             * « Établis », au passé, et non « records » tout court : `prCount`
             * est figé à l'écriture de la séance. Une séance plus ancienne
             * arrivée après coup — le cas normal d'une file de synchronisation —
             * lui reprend ses records sans que ce compteur bouge. Au passé, le
             * chiffre reste vrai, et le détail dit combien tiennent encore.
             */
            <Badge variant="secondary">
              {plural(workout.prCount, "record établi", "records établis")}
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Durée</dt>
              <dd>{ongoing ? "en cours" : formatDuration(workout.durationSec)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Volume</dt>
              <dd>
                <Weight value={workout.totalVolumeKg} />
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Séries</dt>
              <dd>{workout.totalSets}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Exercices</dt>
              <dd>{workout.exerciseCount}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </li>
  );
}
