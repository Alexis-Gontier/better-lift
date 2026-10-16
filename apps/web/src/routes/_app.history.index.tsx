import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/history/")({
  component: HistoryPage,
});

const MONTHS = [
  { label: "Octobre 2026", ids: ["41", "40", "39"] },
  { label: "Septembre 2026", ids: ["38", "37", "36"] },
];

function HistoryPage() {
  return (
    <Page title="Historique">
      <div className="grid gap-4 md:grid-cols-3">
        <Zone title="Recherche" hint="Routine, exercice, note" className="min-h-12 md:col-span-2" />
        <Zone title="Filtres" hint="Routine, exercice" className="min-h-12" />
      </div>
      {MONTHS.map((month) => (
        <section key={month.label} className="flex flex-col gap-3">
          <h2 className="font-medium text-sm">{month.label}</h2>
          {month.ids.map((id) => (
            <Link key={id} to="/history/$id" params={{ id }} className="contents">
              <Zone
                title={`Séance ${id}`}
                hint="Date, routine, durée, volume, records"
                className="min-h-16 transition-colors hover:bg-muted/50"
              />
            </Link>
          ))}
        </section>
      ))}
    </Page>
  );
}
