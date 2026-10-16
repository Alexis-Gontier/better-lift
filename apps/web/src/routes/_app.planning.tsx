import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useTab } from "@/components/page-tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PLANNING_TABS, PlanningView } from "@/features/planning/planning-view";

export const Route = createFileRoute("/_app/planning")({
  staticData: { crumb: "Planning" },
  component: PlanningPage,
});

function PlanningPage() {
  const view = useTab(PLANNING_TABS.map((t) => t.value));
  const { state } = useProto();
  if (state === "nominal") return <PlanningView view={view} />;
  return (
    <PlanningView view={view}>
      {state === "chargement" && (
        <>
          <Skeleton className="h-9 w-80 rounded-lg" />
          <Skeleton className="h-72 rounded-xl" />
        </>
      )}
      {state === "erreur" && <StateError title="Le planning n'a pas pu se charger" />}
      {state === "vide" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>Rien de planifié</EmptyTitle>
            <EmptyDescription>
              Posez une routine sur un jour, puis répétez la semaine pour tracer votre programme.
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
