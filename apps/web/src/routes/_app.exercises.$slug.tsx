import { createFileRoute } from "@tanstack/react-router";
import { DetailEmpty, DetailHeader, DetailSkeleton } from "@/components/list-detail";
import { PageTabs, useTab } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import {
  ExerciseHistory,
  ExerciseRecords,
  ExerciseSummary,
} from "@/features/exercises/exercise-detail";
import { exerciseHistory } from "@/mocks/exercise-history";
import { exerciseBySlug } from "@/mocks/exercises";

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
  const exercise = exerciseBySlug(slug);

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
        title={exercise.name}
        subtitle={`${exercise.muscle} · ${exercise.equipment}`}
        actions={
          <Button variant="outline" size="sm">
            Modifier la note
          </Button>
        }
        tabs={<PageTabs tabs={TABS} />}
      />
      {state === "vide" ? (
        <DetailEmpty
          title="Pas encore fait"
          description={`Ajoutez ${exercise.name} à une routine : sa progression apparaîtra ici après la première séance.`}
        />
      ) : (
        <>
          {tab === "resume" && <ExerciseSummary exercise={exercise} history={history} />}
          {tab === "historique" && <ExerciseHistory history={history} />}
          {tab === "records" && <ExerciseRecords history={history} />}
        </>
      )}
    </>
  );
}
