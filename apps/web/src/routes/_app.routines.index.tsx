import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/routines/")({
  component: RoutinesPage,
});

function RoutinesPage() {
  return (
    <Page
      title="Routines"
      actions={
        <Button asChild>
          <Link to="/routines/new">Nouvelle routine</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Zone
          title="Recherche"
          hint="Nom de routine ou d'exercice"
          className="min-h-12 md:col-span-2"
        />
        <Zone title="Filtres · Tri" hint="Muscles, dernière fois faite" className="min-h-12" />
        <Zone
          title="Dossiers"
          hint="Pastilles : Push / Pull / Jambes / …"
          className="min-h-12 md:col-span-3"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["1", "2", "3", "4", "5", "6"].map((id) => (
          <Link key={id} to="/routines/$id" params={{ id }} className="contents">
            <Zone
              title={`Routine ${id}`}
              hint="Nom, nombre d'exercices, muscles, dernière fois"
              className="h-32 transition-colors hover:bg-muted/50"
            />
          </Link>
        ))}
      </div>
    </Page>
  );
}
