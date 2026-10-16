import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/planning")({
  staticData: { crumb: "Planning" },
  component: PlanningPage,
});

const TABS = [
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
] as const;

function PlanningPage() {
  const tab = useTab(TABS.map((t) => t.value));
  return (
    <Page
      title="Planning"
      tabs={<PageTabs tabs={TABS} />}
      actions={
        <>
          <Button variant="outline">Répéter la semaine</Button>
          <Button>Planifier</Button>
        </>
      }
    >
      <Zone title="Navigation" hint="Précédent · Aujourd'hui · Suivant" className="min-h-14" />
      <div className="grid gap-4 md:grid-cols-4">
        <Zone
          title={tab === "semaine" ? "Semaine" : "Mois"}
          hint={
            tab === "semaine"
              ? "7 colonnes : séances faites (plein), planifiées (contour), manquées"
              : "Grille du mois"
          }
          className="h-[480px] md:col-span-3"
        />
        <Zone title="Routines" hint="À glisser sur un jour" className="h-[480px]" />
      </div>
    </Page>
  );
}
