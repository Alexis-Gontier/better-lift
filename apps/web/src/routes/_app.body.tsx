import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/body")({
  staticData: { crumb: "Corps" },
  component: BodyPage,
});

const TABS = [
  { value: "poids", label: "Poids" },
  { value: "mensurations", label: "Mensurations" },
] as const;

function BodyPage() {
  const tab = useTab(TABS.map((t) => t.value));
  return (
    <Page
      title="Corps"
      tabs={<PageTabs tabs={TABS} />}
      actions={<Button>{tab === "poids" ? "Noter mon poids" : "Noter une mesure"}</Button>}
    >
      {tab === "poids" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Zone
            title="Poids"
            hint="Courbe, moyenne sur 7 jours, objectif en pointillés"
            className="h-80 md:col-span-3"
          />
          <Zone title="Objectif" hint="Cible et avancement" className="h-56" />
          <Zone title="Pesées" hint="Tableau des pesées" className="h-56 md:col-span-2" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Zone title="Bras" hint="Courbe" className="h-56" />
          <Zone title="Taille" hint="Courbe" className="h-56" />
          <Zone title="Cuisse" hint="Courbe" className="h-56" />
          <Zone title="Poitrine" hint="Courbe" className="h-56" />
        </div>
      )}
    </Page>
  );
}
