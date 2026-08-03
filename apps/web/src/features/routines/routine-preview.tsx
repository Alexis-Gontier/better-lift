"use client";

import Link from "next/link";

import { ApiClientError, useRoutine } from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@better-lift/ui/components/card";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@better-lift/ui/components/table";

import { formatRest, SET_TYPE_SHORT, SET_TYPE_TONE } from "./labels";
import { useWeightUnitLabel, Weight } from "@/features/account/units";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { BODY_PART_LABELS, equipmentLabel } from "@/features/exercises/labels";
import { apiClient } from "@/lib/api";

/**
 * Aperçu d'une routine : ce qu'elle prescrit, en lecture seule.
 *
 * Les cibles non renseignées s'affichent « — » plutôt que `0` : une routine
 * qui ne demande qu'un nombre de séries est valide, et afficher un zéro
 * laisserait croire à une charge nulle prescrite.
 */
export function RoutinePreview({ id }: { id: string }) {
  const locale = useProfileLocale();
  const routine = useRoutine(apiClient, id, locale);
  const weightUnit = useWeightUnitLabel();

  if (routine.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (routine.isError) {
    const missing = routine.error instanceof ApiClientError && routine.error.status === 404;

    return (
      <Alert variant="destructive">
        <AlertTitle>
          {missing ? "Cette routine n’existe plus." : "Routine indisponible."}
        </AlertTitle>
        <AlertDescription>
          {missing ? "Elle a pu être supprimée depuis." : routine.error.message}
        </AlertDescription>
        <Button asChild variant="outline" size="sm" className="mt-3 w-fit">
          <Link href="/routines">Retour aux routines</Link>
        </Button>
      </Alert>
    );
  }

  const data = routine.data;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <p className="text-muted-foreground">
            {data.exercises.length} exercice{data.exercises.length > 1 ? "s" : ""}
            {data.notes ? ` · ${data.notes}` : ""}
          </p>
        </div>

        <Button asChild>
          <Link href={`/routines/${data.id}/edit`}>Modifier</Link>
        </Button>
      </header>

      {data.exercises.length === 0 ? (
        <Card size="sm">
          <CardContent className="text-sm text-muted-foreground">
            Cette routine ne contient encore aucun exercice.
          </CardContent>
        </Card>
      ) : (
        <ol className="flex flex-col gap-3">
          {data.exercises.map((exercise, index) => (
            <li key={exercise.id}>
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
                  {exercise.notes && (
                    <p className="mb-2 text-sm text-muted-foreground">{exercise.notes}</p>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>{weightUnit}</TableHead>
                        <TableHead>Reps</TableHead>
                        <TableHead>RPE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exercise.sets.map((set, setIndex) => (
                        <TableRow key={set.id}>
                          <TableCell className={SET_TYPE_TONE[set.type]}>
                            {SET_TYPE_SHORT[set.type] || setIndex + 1}
                          </TableCell>
                          {/*
                            La charge cible passe par `Weight` : elle est stockée
                            en kg et l'en-tête de colonne suit déjà l'unité du
                            profil. L'afficher brute annoncerait des kilos sous
                            un en-tête « lb ».
                          */}
                          <TableCell className="font-mono">
                            <Weight value={set.targetWeightKg} unit={false} />
                          </TableCell>
                          <TableCell className="font-mono">{set.targetReps ?? "—"}</TableCell>
                          <TableCell className="font-mono">{set.targetRpe ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
