"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  useCreateRoutineFolder,
  useDeleteRoutine,
  useDeleteRoutineFolder,
  useDuplicateRoutine,
  useRoutineFolders,
  useRoutines,
} from "@better-lift/api-client";
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
    <li className="rounded-xl bg-surface-raised p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/routines/${routine.id}`}
            className="font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {routine.name}
          </Link>
          <p className="text-sm text-ink-muted">
            {routine.exerciseCount} exercice{routine.exerciseCount > 1 ? "s" : ""} · {lastPerformed}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={`/routines/${routine.id}/edit`}
            className="rounded-lg px-2.5 py-1 ring-1 ring-white/15 hover:bg-white/5"
          >
            Modifier
          </Link>
          <button
            type="button"
            onClick={() => duplicate.mutate(routine.id)}
            disabled={duplicate.isPending}
            className="rounded-lg px-2.5 py-1 text-ink-muted ring-1 ring-white/15 hover:text-ink disabled:opacity-50"
          >
            Dupliquer
          </button>

          {confirming ? (
            <>
              <button
                type="button"
                onClick={() => remove.mutate(routine.id)}
                disabled={remove.isPending}
                className="rounded-lg bg-danger px-2.5 py-1 font-medium text-surface disabled:opacity-50"
              >
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-ink-muted hover:text-ink"
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-lg px-2.5 py-1 text-ink-muted ring-1 ring-white/15 hover:text-danger"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function FolderHeading({ folder }: { folder: RoutineFolder }) {
  const remove = useDeleteRoutineFolder(apiClient);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
        {folder.name}{" "}
        <span className="font-normal normal-case tracking-normal">({folder.routineCount})</span>
      </h2>

      {confirming ? (
        <p className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">Les routines remontent à la racine.</span>
          <button
            type="button"
            onClick={() => remove.mutate(folder.id)}
            disabled={remove.isPending}
            className="rounded-lg bg-danger px-2.5 py-1 font-medium text-surface disabled:opacity-50"
          >
            Confirmer
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-ink-muted hover:text-ink"
          >
            Annuler
          </button>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm text-ink-muted hover:text-danger"
        >
          Supprimer le dossier
        </button>
      )}
    </div>
  );
}

function NewFolderForm() {
  const create = useCreateRoutineFolder(apiClient);
  const [name, setName] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (name.trim()) {
          create.mutate({ name: name.trim() }, { onSuccess: () => setName("") });
        }
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div>
        <label htmlFor="new-folder" className="mb-1 block text-xs text-ink-muted">
          Nouveau dossier
        </label>
        <input
          id="new-folder"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Push Pull Legs"
          className="rounded-lg bg-surface-raised px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>
      <button
        type="submit"
        disabled={create.isPending || !name.trim()}
        className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/5 disabled:opacity-50"
      >
        Créer
      </button>
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
    return <p className="text-sm text-ink-muted">Chargement…</p>;
  }

  if (routines.isError) {
    return (
      <div className="space-y-3 rounded-xl bg-surface-raised p-5">
        <p className="font-medium">Les routines n’ont pas pu être chargées.</p>
        <p className="text-sm text-ink-muted">{routines.error.message}</p>
        <button
          type="button"
          onClick={() => void routines.refetch()}
          className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/5"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if ((routines.data ?? []).length === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 rounded-xl bg-surface-raised p-5">
          <p className="font-medium">Aucune routine pour l’instant.</p>
          <p className="text-sm text-ink-muted">
            Une routine est un gabarit de séance : une liste d’exercices et leurs séries cibles.
            Elle ne bouge pas quand vous vous entraînez.
          </p>
          <Link
            href="/routines/new"
            className="inline-block rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-surface"
          >
            Créer ma première routine
          </Link>
        </div>
        <NewFolderForm />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(({ folder, routines: grouped }) => (
        <section key={folder?.id ?? "sans-dossier"} className="space-y-3">
          {folder ? (
            <FolderHeading folder={folder} />
          ) : (
            grouped.length > 0 && (
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                Sans dossier
              </h2>
            )
          )}

          {grouped.length === 0 ? (
            folder && <p className="text-sm text-ink-muted">Ce dossier est vide.</p>
          ) : (
            <ul className="space-y-2">
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
