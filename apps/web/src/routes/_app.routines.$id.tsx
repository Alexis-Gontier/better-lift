import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/routines/$id")({
  staticData: { crumb: "Détail" },
  component: RoutinePage,
});

function RoutinePage() {
  const { id } = Route.useParams();
  return (
    <Page
      title={`Routine ${id}`}
      actions={
        <>
          <Button variant="outline">Dupliquer</Button>
          <Button variant="outline">Planifier</Button>
          <Button asChild>
            <Link to="/routines/$id/edit" params={{ id }}>
              Modifier
            </Link>
          </Button>
        </>
      }
    >
      <Zone
        title="En-tête"
        hint="Dossier, durée et volume estimés, muscles ciblés, dernière exécution"
        className="min-h-20"
      />
      {["Exercice 1", "Exercice 2 + 3 (superset)", "Exercice 4", "Exercice 5"].map((t) => (
        <Zone
          key={t}
          title={t}
          hint="Séries cibles : charge × répétitions, repos"
          className="min-h-28"
        />
      ))}
    </Page>
  );
}
