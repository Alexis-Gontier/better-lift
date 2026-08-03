"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import {
  useCreateRoutineFolder,
  useDeleteRoutine,
  useDeleteRoutineFolder,
  useDuplicateRoutine,
  useRoutineFolders,
  useRoutines,
} from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Card, CardContent } from "@better-lift/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";
import { Field, FieldLabel } from "@better-lift/ui/components/field";
import { Input } from "@better-lift/ui/components/input";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";
import { type RoutineFolder, type RoutineSummary } from "@better-lift/validators";

import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Liste des routines, groupée par dossier (doc 05).
 *
 * Le regroupement se fait **côté client** : la liste n'est pas paginée et
 * arrive entière, donc un appel par dossier serait du trafic pur. Les routines
 * sans dossier forment un groupe « Sans dossier » en fin de liste — les
 * classer d'office quelque part reviendrait à décider à la place de
 * l'utilisateur.
 */

function RoutineCard({ routine, locale }: { routine: RoutineSummary; locale: string }) {
  const duplicate = useDuplicateRoutine(apiClient);
  const remove = useDeleteRoutine(apiClient);
  const [confirming, setConfirming] = useState(false);

  const lastPerformed = useMemo(() => {
    if (!routine.lastPerformedAt) {
      return "Jamais effectuée";
    }

    // Locale du **profil**, pas celle du navigateur (doc 05).
    return `Dernière fois le ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(routine.lastPerformedAt),
    )}`;
  }, [routine.lastPerformedAt, locale]);

  return (
    // `Card` rend un `<div>` : l'élément de liste reste au-dessus, un `<ul>`
    // n'admettant que des `<li>` en enfant direct.
    <li>
      <Card size="sm">
        <CardContent className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/routines/${routine.id}`}
              className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {routine.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {routine.exerciseCount} exercice{routine.exerciseCount > 1 ? "s" : ""} ·{" "}
              {lastPerformed}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/routines/${routine.id}/edit`}>Modifier</Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => duplicate.mutate(routine.id)}
              disabled={duplicate.isPending}
            >
              {duplicate.isPending && <Spinner data-icon="inline-start" />}
              Dupliquer
            </Button>

            {/*
              Suppression en deux temps, en place — jamais une `confirm()` :
              bloquante, non stylable, et supprimée par certains navigateurs dans
              les iframes. Deux clics volontaires écartent le geste accidentel,
              qui est le seul risque réel ici.
            */}
            {confirming ? (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove.mutate(routine.id)}
                  disabled={remove.isPending}
                >
                  {remove.isPending && <Spinner data-icon="inline-start" />}
                  Confirmer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(false)}
                >
                  Annuler
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
                Supprimer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function FolderHeading({ folder }: { folder: RoutineFolder }) {
  const remove = useDeleteRoutineFolder(apiClient);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
        {folder.name}{" "}
        <span className="font-normal tracking-normal normal-case">({folder.routineCount})</span>
      </h2>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Les routines remontent à la racine.</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => remove.mutate(folder.id)}
            disabled={remove.isPending}
          >
            {remove.isPending && <Spinner data-icon="inline-start" />}
            Confirmer
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
        </div>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
          Supprimer le dossier
        </Button>
      )}
    </div>
  );
}

function NewFolderForm() {
  const create = useCreateRoutineFolder(apiClient);
  const fieldId = useId();
  const [name, setName] = useState("");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (name.trim()) {
          create.mutate({ name: name.trim() }, { onSuccess: () => setName("") });
        }
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <Field className="w-auto">
        <FieldLabel htmlFor={`${fieldId}-folder`}>Nouveau dossier</FieldLabel>
        <Input
          id={`${fieldId}-folder`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Push Pull Legs"
        />
      </Field>

      <Button
        type="submit"
        variant="outline"
        disabled={create.isPending || !name.trim()}
        aria-busy={create.isPending}
      >
        {create.isPending && <Spinner data-icon="inline-start" />}
        Créer
      </Button>
    </form>
  );
}

export function RoutineList() {
  const locale = useProfileLocale();
  const folders = useRoutineFolders(apiClient);
  const routines = useRoutines(apiClient);

  /**
   * Un groupe par dossier existant, plus un groupe final pour les routines
   * sans dossier. Les dossiers vides restent affichés : c'est le seul endroit
   * d'où l'on peut les supprimer, et un dossier qu'on vient de créer doit se
   * voir.
   */
  const groups = useMemo(() => {
    const all = routines.data ?? [];

    return [
      ...(folders.data ?? []).map((folder) => ({
        folder,
        routines: all.filter((routine) => routine.folderId === folder.id),
      })),
      { folder: null, routines: all.filter((routine) => routine.folderId === null) },
    ];
  }, [folders.data, routines.data]);

  if (routines.isPending || folders.isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (routines.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Les routines n’ont pas pu être chargées.</AlertTitle>
        <AlertDescription>{routines.error.message}</AlertDescription>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-fit"
          onClick={() => void routines.refetch()}
        >
          Réessayer
        </Button>
      </Alert>
    );
  }

  if ((routines.data ?? []).length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Aucune routine pour l’instant.</EmptyTitle>
            <EmptyDescription>
              Une routine est un gabarit de séance : une liste d’exercices et leurs séries cibles.
              Elle ne bouge pas quand vous vous entraînez.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/routines/new">Créer ma première routine</Link>
            </Button>
          </EmptyContent>
        </Empty>

        <NewFolderForm />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ folder, routines: grouped }) => (
        <section key={folder?.id ?? "sans-dossier"} className="flex flex-col gap-3">
          {folder ? (
            <FolderHeading folder={folder} />
          ) : (
            grouped.length > 0 && (
              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Sans dossier
              </h2>
            )
          )}

          {grouped.length === 0 ? (
            folder && <p className="text-sm text-muted-foreground">Ce dossier est vide.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {grouped.map((routine) => (
                <RoutineCard key={routine.id} routine={routine} locale={locale} />
              ))}
            </ul>
          )}
        </section>
      ))}

      <NewFolderForm />
    </div>
  );
}
