import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExerciseHistory,
  ExerciseRecords,
  ExerciseSummary,
} from "@/features/exercises/exercise-detail";
import { exerciseHistory } from "@/mocks/exercise-history";
import { exerciseBySlug } from "@/mocks/exercises";

export const Route = createFileRoute("/_app/exercises/$slug")({
  staticData: { crumb: "Détail" },
  component: ExercisePage,
});

const TABS = [
  { value: "resume", label: "Résumé" },
  { value: "historique", label: "Historique" },
  { value: "records", label: "Records" },
] as const;

function ExercisePage() {
  const { slug } = Route.useParams();
  const tab = useTab(TABS.map((t) => t.value));
  const { state } = useProto();
  const exercise = exerciseBySlug(slug);

  if (!exercise) {
    return (
      <Page title="Exercice introuvable">
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Cet exercice n'existe pas</EmptyTitle>
            <EmptyDescription>Il a peut-être été supprimé du catalogue.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link to="/exercises">Retour aux exercices</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Page>
    );
  }

  const history = state === "vide" ? [] : exerciseHistory(slug);

  return (
    <Page
      title={exercise.name}
      tabs={<PageTabs tabs={TABS} />}
      actions={<Button variant="outline">Modifier la note</Button>}
    >
      {state === "chargement" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-80 rounded-xl md:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      )}
      {state === "erreur" && <StateError title="L'exercice n'a pas pu se charger" />}
      {state === "vide" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Pas encore fait</EmptyTitle>
            <EmptyDescription>
              Ajoutez {exercise.name} à une routine : sa progression apparaîtra ici après la
              première séance.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {state === "nominal" && tab === "resume" && (
        <ExerciseSummary exercise={exercise} history={history} />
      )}
      {state === "nominal" && tab === "historique" && <ExerciseHistory history={history} />}
      {state === "nominal" && tab === "records" && <ExerciseRecords history={history} />}
    </Page>
  );
}
