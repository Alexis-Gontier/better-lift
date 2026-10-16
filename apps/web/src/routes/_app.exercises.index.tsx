import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import {
  CustomExercisesEmpty,
  ExerciseList,
  ExerciseListSkeleton,
} from "@/features/exercises/exercise-list";
import { mockExercises } from "@/mocks/exercises";

export const Route = createFileRoute("/_app/exercises/")({
  component: ExercisesPage,
});

const TABS = [
  { value: "catalogue", label: "Catalogue" },
  { value: "mes-exercices", label: "Mes exercices" },
] as const;

function ExercisesPage() {
  const tab = useTab(TABS.map((t) => t.value));
  const { state } = useProto();
  const exercises = mockExercises.filter((e) => (tab === "catalogue" ? !e.custom : e.custom));
  return (
    <Page
      title="Exercices"
      tabs={<PageTabs tabs={TABS} />}
      actions={<Button>Exercice personnalisé</Button>}
    >
      {state === "chargement" && <ExerciseListSkeleton />}
      {state === "erreur" && <StateError title="Les exercices n'ont pas pu se charger" />}
      {state === "vide" && <CustomExercisesEmpty />}
      {state === "nominal" && <ExerciseList key={tab} exercises={exercises} />}
    </Page>
  );
}
