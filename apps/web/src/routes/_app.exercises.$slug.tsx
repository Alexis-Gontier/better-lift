import { createFileRoute } from "@tanstack/react-router";
import { DetailEmpty, DetailHeader, DetailSkeleton } from "@/components/list-detail";
import { PageTabs, useTab } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  ExerciseHistory,
  ExerciseRecords,
  ExerciseSummary,
} from "@/features/exercises/exercise-detail";
import {
  CustomExerciseFields,
  CustomExerciseName,
  commitExercise,
} from "@/features/exercises/exercise-form";
import { exerciseHistory } from "@/mocks/exercise-history";
import { useExercises } from "@/mocks/exercise-store";

export const Route = createFileRoute("/_app/exercises/$slug")({
  staticData: { crumb: "Détail" },
  component: ExercisePane,
});

const TABS = [
  { value: "resume", label: "Résumé" },
  { value: "historique", label: "Historique" },
  { value: "records", label: "Records" },
] as const;

/** La fiche ouverte, dans le panneau de droite ; ses onglets en tête (D236). */
function ExercisePane() {
  const { slug } = Route.useParams();
  const tab = useTab(TABS.map((t) => t.value));
  const { state } = useProto();
  const exercise = useExercises().find((e) => e.slug === slug);

  if (state === "chargement") return <DetailSkeleton />;
  if (state === "erreur") return <StateError title="L'exercice n'a pas pu se charger" />;
  if (!exercise)
    return (
      <DetailEmpty
        title="Cet exercice n'existe pas"
        description="Il a peut-être été supprimé du catalogue."
      />
    );

  const history = state === "vide" ? [] : exerciseHistory(slug);

  return (
    <>
      <DetailHeader
        title={exercise.custom ? <CustomExerciseName exercise={exercise} /> : exercise.name}
        subtitle={
          exercise.custom ? "Exercice personnalisé" : `${exercise.muscle} · ${exercise.equipment}`
        }
        tabs={<PageTabs tabs={TABS} />}
      />
      {exercise.custom && <CustomExerciseFields exercise={exercise} />}
      {state === "vide" ? (
        <DetailEmpty
          title="Pas encore fait"
          description={`Ajoutez ${exercise.name} à une routine : sa progression apparaîtra ici après la première séance.`}
        />
      ) : (
        <>
          {tab === "resume" && (
            <ExerciseSummary
              exercise={exercise}
              history={history}
              onNoteChange={(note) =>
                commitExercise({ ...exercise, note: note.trim() || undefined }, exercise)
              }
            />
          )}
          {tab === "historique" && <ExerciseHistory history={history} />}
          {tab === "records" && <ExerciseRecords history={history} />}
        </>
      )}
    </>
  );
}
