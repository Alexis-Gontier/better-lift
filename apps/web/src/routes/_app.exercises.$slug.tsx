import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

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
  return (
    <Page
      title={slug}
      tabs={<PageTabs tabs={TABS} />}
      actions={<Button variant="outline">Modifier la note</Button>}
    >
      {tab === "resume" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Zone
            title="1RM estimé et meilleure charge"
            hint="Courbe, objectif en pointillés"
            className="h-72 md:col-span-2"
          />
          <Zone title="Muscles" hint="Silhouette avant / arrière" className="h-72" />
          <Zone title="Note épinglée" hint="Réglage de machine, consignes" className="h-48" />
          <Zone title="Pourcentages du 1RM" hint="De 50 à 100 %" className="h-48 md:col-span-2" />
        </div>
      )}
      {tab === "historique" && (
        <Zone
          title="Séances"
          hint="Chaque séance où il apparaît, avec ses séries"
          className="h-[480px]"
        />
      )}
      {tab === "records" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Zone title="Meilleure charge" className="h-28" />
          <Zone title="Meilleur 1RM estimé" className="h-28" />
          <Zone title="Meilleur volume" className="h-28" />
          <Zone
            title="Meilleur par nombre de répétitions"
            hint="1 à 12 répétitions"
            className="h-64 md:col-span-3"
          />
        </div>
      )}
    </Page>
  );
}
