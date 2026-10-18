import { createFileRoute } from "@tanstack/react-router";
import { DetailColumns, DetailColumnsSkeleton } from "@/components/detail-columns";
import { DetailEmpty, DetailHeader } from "@/components/list-detail";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import { ExerciseFigures, ExerciseLook, ExerciseMain } from "@/features/exercises/exercise-detail";
import { exerciseHistory } from "@/mocks/exercise-history";
import { useExercises } from "@/mocks/exercise-store";
import type { MockExercise } from "@/mocks/exercises";

export const Route = createFileRoute("/_app/exercises/$slug")({
  staticData: { crumb: "Détail" },
  component: ExerciseRoute,
});

/** La fiche ouverte, dans le panneau de droite (D235), en deux colonnes (D264). */
function ExerciseRoute() {
  const { slug } = Route.useParams();
  // Tant que la page lit la maquette : nominal, sauf état forcé par l'URL.
  const state = useEtat() ?? "nominal";
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
  return <ExercisePane exercise={exercise} empty={state === "vide"} />;
}

/**
 * La fiche d'un exercice, en lecture seule : la note épinglée et la cible n'ont pas d'API
 * (D294), et le catalogue ne se renomme pas (D286).
 */
function ExercisePane({ exercise, empty }: { exercise: MockExercise; empty: boolean }) {
  const history = empty ? [] : exerciseHistory(exercise.slug);

  return (
    <>
      <DetailHeader title={exercise.name} subtitle={`${exercise.muscle} · ${exercise.equipment}`} />
      <DetailColumns
        id="exercice-fiche"
        main={
          history.length === 0 ? (
            <DetailEmpty
              title="Pas encore fait"
              description={`Ajoutez ${exercise.name} à une routine : sa progression apparaîtra ici après la première séance.`}
            />
          ) : (
            <ExerciseMain history={history} />
          )
        }
        aside={
          <>
            {history.length > 0 && <ExerciseFigures history={history} />}
            <ExerciseLook exercise={exercise} />
          </>
        }
      />
    </>
  );
}
