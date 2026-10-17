import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ListDetailPage } from "@/components/list-detail";
import { LocalTabs } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import {
  CustomExercisesEmpty,
  ExerciseList,
  ExerciseListSkeleton,
} from "@/features/exercises/exercise-list";
import { exerciseBySlug, mockExercises } from "@/mocks/exercises";

export const Route = createFileRoute("/_app/exercises")({
  staticData: { crumb: "Exercices" },
  component: ExercisesPage,
});

const TABS = [
  { value: "catalogue", label: "Catalogue" },
  { value: "mes-exercices", label: "Mes exercices" },
] as const;

type Tab = (typeof TABS)[number]["value"];

/**
 * La liste reste montée ; la fiche ouverte est la route enfant (D235). L'onglet de la liste
 * est local, pour ne pas se mêler à ceux de la fiche (`?onglet=`, D236) ; il part de
 * l'exercice ouvert, pour que sa ligne soit visible.
 */
function ExercisesPage() {
  const { state } = useProto();
  const { slug } = useParams({ strict: false });
  const [tab, setTab] = useState<Tab>(() =>
    slug && exerciseBySlug(slug)?.custom ? "mes-exercices" : "catalogue",
  );
  const exercises = mockExercises.filter((e) => (tab === "catalogue" ? !e.custom : e.custom));
  return (
    <ListDetailPage
      key={state}
      title="Exercices"
      tabs={<LocalTabs tabs={TABS} value={tab} onChange={setTab} />}
      actions={<Button>Exercice personnalisé</Button>}
      storageId="exercices"
      detail={<Outlet />}
    >
      {state === "chargement" && <ExerciseListSkeleton />}
      {state === "erreur" && <StateError title="Les exercices n'ont pas pu se charger" />}
      {state === "vide" && <CustomExercisesEmpty />}
      {state === "nominal" && <ExerciseList key={tab} exercises={exercises} />}
    </ListDetailPage>
  );
}
