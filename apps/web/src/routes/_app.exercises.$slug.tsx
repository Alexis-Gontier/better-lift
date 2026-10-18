import { createFileRoute } from "@tanstack/react-router";
import { DetailColumns, DetailColumnsSkeleton } from "@/components/detail-columns";
import { useEditable } from "@/components/editable";
import { DetailEmpty, DetailHeader } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { ExerciseFigures, ExerciseLook, ExerciseMain } from "@/features/exercises/exercise-detail";
import {
  type ExerciseDraft,
  ExerciseMenu,
  ExerciseNameInput,
  ExerciseNote,
  ExerciseSettings,
  exerciseChangeCount,
  fromExerciseDraft,
  toExerciseDraft,
} from "@/features/exercises/exercise-form";
import { exerciseHistory } from "@/mocks/exercise-history";
import { saveExercise, useExercises } from "@/mocks/exercise-store";
import type { MockExercise } from "@/mocks/exercises";

export const Route = createFileRoute("/_app/exercises/$slug")({
  staticData: { crumb: "Détail" },
  component: ExerciseRoute,
});

/** La fiche ouverte, dans le panneau de droite (D235), en deux colonnes (D264). */
function ExerciseRoute() {
  const { slug } = Route.useParams();
  const { state } = useProto();
  const exercise = useExercises().find((e) => e.slug === slug);

  if (state === "chargement") return <DetailColumnsSkeleton />;
  if (state === "erreur") return <StateError title="L'exercice n'a pas pu se charger" />;
  if (!exercise)
    return (
      <DetailEmpty
        title="Cet exercice n'existe pas"
        description="Il a peut-être été supprimé du catalogue."
      />
    );
  // `key` : d'un exercice à l'autre, le brouillon repart de zéro.
  return <ExercisePane key={slug} exercise={exercise} empty={state === "vide"} />;
}

/**
 * La fiche d'un exercice, modifiable comme une routine (D264) : la note de tout exercice ; le nom,
 * le muscle et l'équipement d'un exercice personnel. Le catalogue, lui, ne se renomme pas.
 */
function ExercisePane({ exercise, empty }: { exercise: MockExercise; empty: boolean }) {
  const edit = useEditable<ExerciseDraft>({
    initial: () => toExerciseDraft(exercise),
    isDirty: (d) => exerciseChangeCount(d, exercise) > 0,
    count: (d) => exerciseChangeCount(d, exercise),
    blocker: (d) => (d.name.trim() === "" ? "Donnez-lui un nom" : null),
    onSave: (d) => saveExercise(fromExerciseDraft(d, exercise)),
    what: "cet exercice",
    savedMessage: "Exercice enregistré",
  });
  const { draft, setDraft } = edit;
  const history = empty ? [] : exerciseHistory(exercise.slug);
  const looked = { ...exercise, muscle: draft.muscle, equipment: draft.equipment };

  return (
    <>
      <DetailHeader
        title={
          exercise.custom ? <ExerciseNameInput draft={draft} onChange={setDraft} /> : exercise.name
        }
        subtitle={
          exercise.custom ? "Exercice personnel" : `${exercise.muscle} · ${exercise.equipment}`
        }
        actions={edit.actions(
          exercise.custom ? <ExerciseMenu exercise={exercise} release={edit.release} /> : null,
        )}
      />
      <DetailColumns
        id="exercice-fiche"
        main={
          history.length === 0 ? (
            <DetailEmpty
              title="Pas encore fait"
              description={`Ajoutez ${exercise.name} à une routine : sa progression apparaîtra ici après la première séance.`}
            />
          ) : (
            <ExerciseMain exercise={looked} history={history} />
          )
        }
        aside={
          <>
            {history.length > 0 && <ExerciseFigures history={history} />}
            <ExerciseNote draft={draft} onChange={setDraft} />
            {exercise.custom && <ExerciseSettings draft={draft} onChange={setDraft} />}
            <ExerciseLook exercise={looked} />
          </>
        }
      />
      {edit.guard}
    </>
  );
}
