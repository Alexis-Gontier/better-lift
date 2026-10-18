import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PlanningSkeleton, PlanningView } from "@/features/planning/planning-view";

export const Route = createFileRoute("/_app/planning")({
  staticData: { crumb: "Planning" },
  component: PlanningPage,
});

/** Le Planning (D269) ; hors de l'état nominal, la barre et la colonne restent, le calendrier cède. */
function PlanningPage() {
  const { state } = useProto();
  if (state === "nominal") return <PlanningView />;
  return (
    <PlanningView>
      {state === "chargement" && <PlanningSkeleton />}
      {state === "erreur" && <StateError title="Le planning n'a pas pu se charger" />}
      {state === "vide" && (
        <Empty className="flex-1 border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>Rien de planifié</EmptyTitle>
            <EmptyDescription>
              Glissez une routine de la colonne de gauche sur un jour, puis répétez la semaine pour
              tracer votre programme.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link to="/routines">Voir les routines</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </PlanningView>
  );
}
