import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/history/$id")({
  staticData: { crumb: "Détail" },
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  return (
    <Page title={`Séance ${id}`} actions={<Button variant="outline">Supprimer</Button>}>
      <div className="grid gap-4 md:grid-cols-3">
        <Zone title="Durée" className="min-h-20" />
        <Zone title="Volume" className="min-h-20" />
        <Zone title="Records" className="min-h-20" />
      </div>
      <Zone
        title="Écart avec la séance précédente"
        hint="Même routine : volume ±, records"
        className="min-h-16"
      />
      {["Exercice 1", "Exercice 2", "Exercice 3", "Exercice 4"].map((t) => (
        <Zone
          key={t}
          title={t}
          hint="Séries faites, badges de record, notes"
          className="min-h-28"
        />
      ))}
    </Page>
  );
}
