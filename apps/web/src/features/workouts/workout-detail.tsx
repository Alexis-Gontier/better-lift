"use client";

import { TriangleAlertIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ApiClientError, useDeleteWorkout, useWorkout } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@better-lift/ui/components/table";
import { cn } from "@better-lift/ui/lib/utils";
import { type WorkoutDetail as Workout, type WorkoutExercise } from "@better-lift/validators";

import { formatDuration, formatSetDuration, plural } from "./labels";
import {
  Distance,
  useDistanceUnitLabel,
  useWeightUnitLabel,
  Weight,
} from "@/features/account/units";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { useProfileTimezone } from "@/features/account/use-profile-timezone";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";
import { formatRest, SET_TYPE_SHORT, SET_TYPE_TONE } from "@/features/routines/labels";
import { apiClient } from "@/lib/api";

/**
 * Détail d'une séance (doc 05, § Détail d'une séance).
 *
 * Un **instantané** : ce que montre cet écran est ce qui a été fait, jamais ce
 * que la routine d'origine prescrit aujourd'hui (règle non négociable n°5).
 * D'où l'absence de lien « voir la routine » sur les exercices — la routine a
 * pu changer dix fois depuis, et la comparaison induirait en erreur.
 */
export function WorkoutDetail({ id }: { id: string }) {
  const locale = useProfileLocale();
  const workout = useWorkout(apiClient, id, locale);

  if (workout.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (workout.isError) {
    const missing = workout.error instanceof ApiClientError && workout.error.status === 404;

    return (
      <Alert variant="destructive">
        <AlertTitle>{missing ? "Cette séance n’existe plus." : "Séance indisponible."}</AlertTitle>
        <AlertDescription>
          {missing ? "Elle a pu être supprimée depuis." : workout.error.message}
        </AlertDescription>
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href="/workouts">Retour à l’historique</Link>
        </Button>
      </Alert>
    );
  }

  return <WorkoutArticle workout={workout.data} />;
}

function WorkoutArticle({ workout }: { workout: Workout }) {
  const locale = useProfileLocale();
  const timeZone = useProfileTimezone();

  const when = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone,
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(workout.startedAt)),
    [workout.startedAt, locale, timeZone],
  );

  const ongoing = workout.endedAt === null;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{workout.title}</h1>
          <p className="text-muted-foreground first-letter:uppercase">{when}</p>
        </div>

        {/*
          Modifier avant Supprimer, et dans cet ordre : c'est le geste que l'on
          vient chercher neuf fois sur dix — une charge mal notée entre deux
          séries. La suppression reste à côté, mais elle n'est pas le recours
          par défaut à une erreur de saisie.
        */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/workouts/${workout.id}/edit`}>Modifier</Link>
          </Button>
          <DeleteWorkout id={workout.id} title={workout.title} />
        </div>
      </header>

      {ongoing && (
        /*
          `variant="default"` et une icône, plutôt qu'un ambre écrit en dur : la
          palette n'a pas de token d'avertissement, et `bg-amber-400/10` ne
          répond ni au thème clair ni à un futur changement de palette. Le
          triangle porte le sens que la couleur portait.
        */
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>Séance encore en cours.</AlertTitle>
          <AlertDescription>
            Elle n’a pas de fin enregistrée, ses totaux ne sont donc pas définitifs.
          </AlertDescription>
        </Alert>
      )}

      <Summary workout={workout} />

      {workout.notes && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{workout.notes}</p>
          </CardContent>
        </Card>
      )}

      {workout.exercises.length === 0 ? (
        <Card size="sm">
          <CardContent className="text-sm text-muted-foreground">
            Cette séance ne contient aucun exercice.
          </CardContent>
        </Card>
      ) : (
        <ol className="flex flex-col gap-3">
          {workout.exercises.map((exercise, index) => (
            <li key={exercise.id}>
              <ExerciseBlock exercise={exercise} index={index} />
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

/**
 * Le résumé lit les agrégats **dénormalisés** de la séance plutôt que de
 * sommer les séries à l'affichage : ce sont les mêmes chiffres que ceux de la
 * carte d'historique, calculés une fois à l'écriture (doc 03, §3). Les
 * recalculer ici finirait par produire un total qui diverge de l'autre écran —
 * l'échauffement compté d'un côté et pas de l'autre, par exemple.
 */
function Summary({ workout }: { workout: Workout }) {
  const cells = [
    { label: "Durée", value: workout.endedAt === null ? "—" : formatDuration(workout.durationSec) },
    { label: "Volume", value: <Weight value={workout.totalVolumeKg} /> },
    { label: "Séries", value: workout.totalSets },
    { label: "Répétitions", value: workout.totalReps },
  ];

  /**
   * Le bandeau compte les **séries qui portent encore un record**, et non le
   * `prCount` de la séance.
   *
   * Les deux ne disent pas la même chose : `prCount` est figé à l'écriture — le
   * nombre de records tombés ce jour-là —, tandis qu'`isPr` est réécrit chaque
   * fois que les records de l'exercice sont reconstruits. Une séance ancienne
   * envoyée après coup par la file de synchronisation reprend les records
   * qu'elle mérite, et les retire à la séance qui les détenait. Afficher
   * `prCount` ici annoncerait « 5 records » au-dessus d'un seul trophée.
   *
   * On compte donc ce que l'écran montre, ce qui est aussi la donnée la plus
   * fraîche. La carte d'historique garde `prCount` : elle n'a pas les séries
   * sous la main, et les charger pour vingt cartes ruinerait la
   * dénormalisation qui fait tenir la liste.
   */
  const recordSets = workout.exercises.reduce(
    (count, exercise) => count + exercise.sets.filter((set) => set.isPr).length,
    0,
  );

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((cell) => (
        <Card key={cell.label} size="sm">
          <CardContent>
            <dt className="text-xs tracking-wider text-muted-foreground uppercase">{cell.label}</dt>
            <dd className="mt-1 text-lg font-medium">{cell.value}</dd>
          </CardContent>
        </Card>
      ))}

      {recordSets > 0 && (
        <Card size="sm" className="col-span-2 bg-primary/10 sm:col-span-4">
          <CardContent>
            <dt className="flex items-center gap-1.5 text-xs tracking-wider text-muted-foreground uppercase">
              <TrophyIcon className="size-3.5" aria-hidden />
              Records
            </dt>
            <dd className="mt-1 text-lg font-medium">
              {plural(recordSets, "série détient", "séries détiennent")} encore un record personnel
            </dd>
          </CardContent>
        </Card>
      )}
    </dl>
  );
}

function ExerciseBlock({ exercise, index }: { exercise: WorkoutExercise; index: number }) {
  const weightUnit = useWeightUnitLabel();
  const distanceUnit = useDistanceUnitLabel();

  /**
   * Les colonnes de durée et de distance n'apparaissent que si l'exercice s'en
   * sert. Les afficher toujours donnerait quatre colonnes de tirets sur un
   * développé couché ; ne jamais les afficher ferait une planche entièrement
   * vide, ce qui se lit comme une donnée perdue alors qu'elle est là.
   */
  const showsDuration = exercise.sets.some((set) => set.durationSec !== null);
  const showsDistance = exercise.sets.some((set) => set.distanceM !== null);

  return (
    <Card size="sm">
      <CardHeader className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle>
          <span className="mr-2 text-muted-foreground">{index + 1}.</span>
          <Link href={`/exercises/${exercise.exercise.id}`} className="hover:underline">
            {exercise.exercise.name}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {BODY_PART_LABELS[exercise.exercise.bodyPart]} ·{" "}
          {equipmentLabel(exercise.exercise.equipment)}
          {exercise.restSec === null ? "" : ` · repos ${formatRest(exercise.restSec)}`}
        </p>
      </CardHeader>

      <CardContent>
        {exercise.notes && <p className="mb-2 text-sm text-muted-foreground">{exercise.notes}</p>}

        {exercise.sets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune série enregistrée.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{weightUnit}</TableHead>
                <TableHead>Reps</TableHead>
                {showsDuration && <TableHead>Durée</TableHead>}
                {showsDistance && <TableHead>{distanceUnit}</TableHead>}
                <TableHead>RPE</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Record</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercise.sets.map((set, setIndex) => (
                <TableRow
                  key={set.id}
                  /*
                    Une série non validée reste affichée — l'utilisateur voit ce
                    qu'il n'a pas fait — mais en retrait : elle ne compte ni dans
                    le volume ni dans les records (doc 03).
                  */
                  className={cn(!set.completed && "text-muted-foreground/50")}
                >
                  <TableCell className={SET_TYPE_TONE[set.type]}>
                    {SET_TYPE_SHORT[set.type] || setIndex + 1}
                  </TableCell>
                  <TableCell className="font-mono">
                    <Weight value={set.weightKg} unit={false} />
                  </TableCell>
                  <TableCell className="font-mono">{set.reps ?? "—"}</TableCell>
                  {showsDuration && (
                    <TableCell className="font-mono">
                      {set.durationSec === null ? "—" : formatSetDuration(set.durationSec)}
                    </TableCell>
                  )}
                  {showsDistance && (
                    <TableCell className="font-mono">
                      <Distance value={set.distanceM} unit={false} />
                    </TableCell>
                  )}
                  <TableCell className="font-mono">{set.rpe ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {set.isPr && (
                      <>
                        <TrophyIcon className="inline size-4" aria-hidden />
                        <span className="sr-only">Record personnel</span>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Suppression en deux temps, en place — jamais une `confirm()` : bloquante, non
 * stylable, et supprimée par certains navigateurs dans les iframes. Même
 * traitement que l'archivage d'un exercice (doc 05).
 *
 * L'avertissement nomme la conséquence réelle : supprimer une séance fait
 * **recalculer les records** des exercices qu'elle touchait, et un record peut
 * disparaître. C'est irréversible et non évident.
 */
function DeleteWorkout({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const remove = useDeleteWorkout(apiClient);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        Supprimer
      </Button>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Supprimer « {title} » ?</CardTitle>
        <p className="text-sm text-muted-foreground">
          Définitif. Les records qu’elle détenait sont recalculés depuis le reste de l’historique.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {remove.isError && (
          <Alert variant="destructive">
            <AlertDescription>{remove.error.message}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() =>
              remove.mutate(id, {
                // La séance n'existe plus : rester sur sa page afficherait un 404.
                onSuccess: () => router.replace("/workouts"),
              })
            }
            disabled={remove.isPending}
          >
            {remove.isPending && <Spinner data-icon="inline-start" />}
            Confirmer
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
