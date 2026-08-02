"use client";

import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useReducer, useState } from "react";

import { useCreateRoutine, useReplaceRoutine, useRoutineFolders } from "@better-lift/api-client";
import { type RoutineDetail, routineStructureSchema } from "@better-lift/validators";

import {
  countSets,
  type DraftAction,
  draftReducer,
  emptyDraft,
  fromDetail,
  type RoutineDraft,
  toStructure,
} from "./draft";
import { clearDraft, loadDraft, saveDraft } from "./draft-storage";
import { EditorExercise } from "./editor-exercise";
import { ExercisePicker } from "./exercise-picker";
import { exerciseDndId, parseDndId, SortableRow } from "./sortable";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

/**
 * Éditeur de routines (doc 05).
 *
 * C'est l'écran qui justifie l'existence de l'application web. Trois partis
 * pris le structurent :
 *
 * 1. **Tout vit dans un brouillon local.** Rien n'est envoyé avant
 *    l'enregistrement, qui fait un unique `POST` ou `PUT`. Le serveur remplace
 *    alors la structure entière — c'est ce qui permet de réordonner librement
 *    sans négocier chaque déplacement avec lui.
 * 2. **Le glisser-déposer a une alternative clavier**, branchée et annoncée.
 *    Un éditeur qui ne se pilote qu'à la souris ne tient pas l'objectif
 *    WCAG 2.1 AA que s'est donné le projet.
 * 3. **Le panneau d'ajout reste ouvert.** On construit une routine de six
 *    exercices, pas d'un seul.
 */

/**
 * Ne considère que les cibles **de même nature** que l'élément saisi.
 *
 * Sans ce filtre, `closestCenter` propose au glissement d'un exercice les
 * lignes de séries qui se trouvent juste en dessous : la cible la plus proche
 * du centre n'est presque jamais l'exercice suivant. Le déposé était alors
 * rejeté, et le déplacement ne se produisait tout simplement pas — sans erreur,
 * ce qui l'a rendu invisible jusqu'à l'essai au clavier.
 *
 * Une série est en plus restreinte à son propre exercice : la déplacer
 * ailleurs mettrait ses valeurs sous un exercice d'un autre type.
 */
const sameKindCollision: CollisionDetection = (args) => {
  const active = parseDndId(String(args.active.id));

  if (!active) {
    return closestCenter(args);
  }

  const droppableContainers = args.droppableContainers.filter((container) => {
    const target = parseDndId(String(container.id));

    if (!target || target.kind !== active.kind) {
      return false;
    }

    return active.kind === "set" && target.kind === "set"
      ? target.exerciseKey === active.exerciseKey
      : true;
  });

  return closestCenter({ ...args, droppableContainers });
};

/**
 * Messages lus par le lecteur d'écran pendant un déplacement au clavier.
 *
 * Sans eux, `dnd-kit` annonce des identifiants techniques : « ex:9f3c-… est
 * déplacé ». La liste étant réordonnable, l'utilisateur a besoin de savoir où
 * il en est, pas quelle clé il tient.
 */
const announcements = {
  onDragStart: () => "Élément saisi. Utilisez les flèches pour le déplacer, Entrée pour déposer.",
  onDragOver: () => "Position en cours de changement.",
  onDragEnd: () => "Élément déposé.",
  onDragCancel: () => "Déplacement annulé, l'élément retrouve sa place.",
};

export function RoutineEditor({ routine }: { routine?: RoutineDetail }) {
  const router = useRouter();
  const locale = useProfileLocale();
  const fieldId = useId();
  const routineId = routine?.id ?? null;

  const [draft, dispatch] = useReducer(
    draftReducer,
    routine,
    (initial) => (initial ? fromDetail(initial) : emptyDraft()) satisfies RoutineDraft,
  );

  const [error, setError] = useState<string | null>(null);
  const [restorable, setRestorable] = useState<RoutineDraft | null>(null);

  const folders = useRoutineFolders(apiClient);
  const create = useCreateRoutine(apiClient, locale);
  const replace = useReplaceRoutine(apiClient, locale);
  const mutation = routine ? replace : create;

  /**
   * Une modification suffit à considérer le brouillon en cours : on ne compare
   * pas au serveur. Comparer demanderait une égalité profonde sur une
   * structure dont les clés sont régénérées à chaque chargement, pour décider
   * s'il faut afficher un avertissement — un coût sans rapport avec le gain.
   */
  const [dirty, setDirty] = useState(false);

  /**
   * Toute action passe par ici plutôt que par `dispatch` directement : c'est
   * le seul endroit où l'on sait qu'une modification a eu lieu, et l'oublier
   * une fois suffirait à perdre l'avertissement de fermeture.
   *
   * Aucune dépendance : `dispatch` et `setDirty` ont une identité stable
   * garantie par React.
   */
  const run = useCallback((action: DraftAction) => {
    setDirty(true);
    dispatch(action);
  }, []);

  // Brouillon relu au montage : c'est le filet contre l'onglet fermé par
  // inadvertance. Proposé, jamais imposé — l'écran ne doit pas se remplir
  // tout seul d'un état que l'utilisateur ne reconnaîtrait pas.
  useEffect(() => {
    const stored = loadDraft(routineId);

    if (stored) {
      setRestorable(stored);
    }
  }, [routineId]);

  useEffect(() => {
    if (dirty) {
      saveDraft(routineId, draft);
    }
  }, [dirty, draft, routineId]);

  /** Dernier rempart : le navigateur demande confirmation avant de fermer. */
  useEffect(() => {
    if (!dirty) {
      return;
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = useCallback(async () => {
    const parsed = routineStructureSchema.safeParse(toStructure(draft));

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "La routine est incomplète.");
      return;
    }

    setError(null);

    try {
      const saved = routine
        ? await replace.mutateAsync({ id: routine.id, input: parsed.data })
        : await create.mutateAsync(parsed.data);

      // Le brouillon a fait son office : le garder ferait proposer une
      // restauration périmée au prochain passage.
      clearDraft(routineId);
      setDirty(false);
      router.push(`/routines/${saved.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    }
  }, [draft, routine, replace, create, routineId, router]);

  /** `⌘S` / `Ctrl+S` enregistre, comme dans n'importe quel éditeur (doc 05). */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const sensors = useSensors(
    // Un seuil de 6 px : sans lui, le moindre tremblement sur un bouton de la
    // poignée serait pris pour un début de glissement.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const from = parseDndId(String(active.id));
    const to = parseDndId(String(over.id));

    if (!from || !to || from.kind !== to.kind) {
      return;
    }

    if (from.kind === "exercise" && to.kind === "exercise") {
      run({ type: "moveExercise", from: from.key, to: to.key });
      return;
    }

    // Une série ne se déplace qu'à l'intérieur de son exercice : ailleurs, le
    // type de l'exercice ne correspondrait plus aux champs saisis.
    if (from.kind === "set" && to.kind === "set" && from.exerciseKey === to.exerciseKey) {
      run({ type: "moveSet", exerciseKey: from.exerciseKey, from: from.setKey, to: to.setKey });
    }
  }

  const exerciseIds = draft.exercises.map((exercise) => exerciseDndId(exercise.key));

  return (
    <div className="space-y-6">
      {restorable && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-4"
        >
          <p className="text-sm">Un brouillon non enregistré a été retrouvé sur cet appareil.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                // Le brouillon est restauré **en entier**, séries et valeurs
                // comprises : n'en remettre qu'une partie serait pire que de
                // ne rien proposer.
                dispatch({ type: "replaceDraft", draft: restorable });
                setRestorable(null);
                setDirty(true);
              }}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              Restaurer
            </button>
            <button
              type="button"
              onClick={() => {
                clearDraft(routineId);
                setRestorable(null);
              }}
              className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-accent"
            >
              Ignorer
            </button>
          </div>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label htmlFor={`${fieldId}-name`} className="mb-1 block text-xs text-muted-foreground">
              Nom de la routine
            </label>
            <input
              id={`${fieldId}-name`}
              value={draft.name}
              onChange={(event) => run({ type: "setName", value: event.target.value })}
              placeholder="Push A"
              className="w-full rounded-lg bg-card px-3 py-2 text-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <label
                htmlFor={`${fieldId}-folder`}
                className="mb-1 block text-xs text-muted-foreground"
              >
                Dossier
              </label>
              <select
                id={`${fieldId}-folder`}
                value={draft.folderId ?? ""}
                onChange={(event) => run({ type: "setFolder", value: event.target.value || null })}
                className="rounded-lg bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <option value="">Aucun</option>
                {(folders.data ?? []).map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-48 flex-1">
              <label
                htmlFor={`${fieldId}-notes`}
                className="mb-1 block text-xs text-muted-foreground"
              >
                Notes
              </label>
              <input
                id={`${fieldId}-notes`}
                value={draft.notes}
                onChange={(event) => run({ type: "setNotes", value: event.target.value })}
                placeholder="Barre à 20 kg…"
                className="w-full rounded-lg bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {draft.exercises.length} exercice{draft.exercises.length > 1 ? "s" : ""} ·{" "}
            {countSets(draft)} série{countSets(draft) > 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={() => void save()}
            disabled={mutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={sameKindCollision}
        onDragEnd={onDragEnd}
        accessibility={{ announcements }}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-3">
            <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
              {draft.exercises.map((exercise, index) => (
                <SortableRow
                  key={exercise.key}
                  id={exerciseDndId(exercise.key)}
                  label={`l’exercice ${exercise.exercise.name}`}
                >
                  <EditorExercise exercise={exercise} index={index} dispatch={run} />
                </SortableRow>
              ))}
            </SortableContext>

            {draft.exercises.length === 0 && (
              <p className="rounded-xl bg-card p-5 text-sm text-muted-foreground">
                Aucun exercice pour l’instant. Ajoutez-en depuis le panneau de droite.
              </p>
            )}
          </div>

          <ExercisePicker onAdd={(exercise) => run({ type: "addExercise", exercise })} />
        </div>
      </DndContext>
    </div>
  );
}
