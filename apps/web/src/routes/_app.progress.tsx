import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/progress")({
  staticData: { crumb: "Progression" },
  component: ProgressPage,
});

const TABS = [
  { value: "graphiques", label: "Graphiques" },
  { value: "records", label: "Records" },
] as const;

function ProgressPage() {
  const tab = useTab(TABS.map((t) => t.value));
  return (
    <Page
      title="Progression"
      tabs={<PageTabs tabs={TABS} />}
      actions={<Button variant="outline">3 mois</Button>}
    >
      {tab === "graphiques" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Zone title="Volume par muscle" hint="Barres et silhouette" className="h-72" />
          <Zone title="Fréquence par muscle" hint="Séances par semaine" className="h-72" />
          <Zone title="Durée des séances" hint="Dans le temps" className="h-72" />
          <Zone title="Nombre de séances" hint="Par semaine" className="h-72" />
        </div>
      ) : (
        <>
          <Zone title="Filtres" hint="Muscle, type de record" className="min-h-14" />
          <Zone
            title="Records"
            hint="Tableau triable : exercice, type, valeur, date"
            className="h-[480px]"
          />
        </>
      )}
    </Page>
  );
}
