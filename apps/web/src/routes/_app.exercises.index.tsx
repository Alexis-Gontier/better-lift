import { createFileRoute, Link } from "@tanstack/react-router";
import { ListDetail } from "@/components/list-detail";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { ExerciseSummary } from "@/features/exercises/exercise-detail";
import {
  CustomExercisesEmpty,
  ExerciseList,
  ExerciseListSkeleton,
} from "@/features/exercises/exercise-list";
import { exerciseHistory } from "@/mocks/exercise-history";
import { exerciseBySlug, mockExercises } from "@/mocks/exercises";

export const Route = createFileRoute("/_app/exercises/")({
  component: ExercisesPage,
});

const TABS = [
  { value: "catalogue", label: "Catalogue" },
  { value: "mes-exercices", label: "Mes exercices" },
] as const;

/** A : fiche sur sa page. B : liste | détail redimensionnable. C : fiche en panneau latéral. */
function ExercisesPage() {
  const tab = useTab(TABS.map((t) => t.value));
  const { state, variant } = useProto();
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
      {state === "nominal" && (
        <ListDetail
          key={`${variant}-${tab}`}
          variant={variant}
          storageId="exercices"
          defaultSelected={exercises[0]?.slug ?? null}
          detail={(slug) => {
            const exercise = exerciseBySlug(slug);
            if (!exercise) return null;
            return {
              title: exercise.name,
              subtitle: `${exercise.muscle} · ${exercise.equipment}`,
              href: (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/exercises/$slug" params={{ slug }}>
                    Ouvrir la fiche
                  </Link>
                </Button>
              ),
              body: <ExerciseSummary exercise={exercise} history={exerciseHistory(slug)} />,
            };
          }}
        >
          <ExerciseList exercises={exercises} />
        </ListDetail>
      )}
    </Page>
  );
}
