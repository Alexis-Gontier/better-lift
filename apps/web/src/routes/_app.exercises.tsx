import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
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
import { useExercises } from "@/mocks/exercise-store";
import { exerciseBySlug } from "@/mocks/exercises";

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
 * est local, pour ne pas se mêler à ceux de la fiche (`?onglet=`, D236) ; il suit
 * l'exercice ouvert, pour que sa ligne soit visible.
 */
function ExercisesPage() {
  const { state } = useProto();
  const { slug } = useParams({ strict: false });
  const kindOf = (s?: string): Tab =>
    s && exerciseBySlug(s)?.custom ? "mes-exercices" : "catalogue";
  const [tab, setTab] = useState<Tab>(() => kindOf(slug));
  // Un autre exercice ouvert (création, palette, lien) : l'onglet le suit, pour que sa ligne se voie.
  const [openSlug, setOpenSlug] = useState(slug);
  if (slug !== openSlug) {
    setOpenSlug(slug);
    if (slug) setTab(kindOf(slug));
  }
  // Un exercice qu'on crée est personnalisé : sa ligne brouillon vit dans « Mes exercices ».
  const creating = useRouterState({ select: (s) => s.location.pathname === "/exercises/new" });
  const shownTab = creating ? "mes-exercices" : tab;
  const exercises = useExercises().filter((e) => (shownTab === "catalogue" ? !e.custom : e.custom));
  return (
    <ListDetailPage
      key={state}
      title="Exercices"
      tabs={<LocalTabs tabs={TABS} value={shownTab} onChange={setTab} />}
      actions={
        <Button asChild>
          <Link to="/exercises/new" search>
            Exercice personnalisé
          </Link>
        </Button>
      }
      storageId="exercices"
      detail={<Outlet />}
    >
      {state === "chargement" && <ExerciseListSkeleton />}
      {state === "erreur" && <StateError title="Les exercices n'ont pas pu se charger" />}
      {state === "vide" && <CustomExercisesEmpty />}
      {state === "nominal" && <ExerciseList key={shownTab} exercises={exercises} />}
    </ListDetailPage>
  );
}
