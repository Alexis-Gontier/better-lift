import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PeriodToggle } from "@/features/progress/period-toggle";
import { ProgressSkeleton, ProgressView } from "@/features/progress/progress-view";
import { RoutineProgress } from "@/features/progress/routine-progress";
import { inPeriod, type Period } from "@/mocks/progress";
import { useRoutines } from "@/mocks/routine-store";
import { useSessions } from "@/mocks/session-store";
import { TODAY } from "@/mocks/today";

export const Route = createFileRoute("/_app/progress")({
  staticData: { crumb: "Progression" },
  // `?routine=` ouvre la vue Par routine sur cette routine (D279) ; sans lui, la vue d'ensemble.
  // Le routeur lit `?routine=2` comme un nombre : on le ramène à la chaîne de l'identifiant.
  validateSearch: (search: Record<string, unknown>): { routine?: string } =>
    (typeof search.routine === "string" && search.routine !== "") ||
    typeof search.routine === "number"
      ? { routine: String(search.routine) }
      : {},
  component: ProgressPage,
});

function ProgressPage() {
  const { state } = useProto();
  const { routine } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const sessions = useSessions();
  const routines = useRoutines();
  const [period, setPeriod] = useState<Period>("3m");

  // Par défaut, la routine la plus faite sur la période.
  const mostDone = () => {
    const counts = new Map<string, number>();
    for (const s of inPeriod(sessions, period, TODAY))
      counts.set(s.routine, (counts.get(s.routine) ?? 0) + 1);
    const name = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return routines.find((r) => r.name === name)?.id ?? routines[0]?.id ?? "";
  };
  const setRoutine = (id: string | undefined) =>
    navigate({ search: (s) => ({ ...s, routine: id }), replace: true });

  return (
    <Page
      title="Progression"
      actions={
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="Vue"
            value={routine ? "routine" : "ensemble"}
            onValueChange={(v) => v && setRoutine(v === "routine" ? mostDone() : undefined)}
          >
            <ToggleGroupItem value="ensemble">Vue d'ensemble</ToggleGroupItem>
            <ToggleGroupItem value="routine">Par routine</ToggleGroupItem>
          </ToggleGroup>
          <PeriodToggle value={period} onChange={setPeriod} />
        </>
      }
    >
      {state === "chargement" && <ProgressSkeleton />}
      {state === "erreur" && <StateError title="La progression n'a pas pu se charger" />}
      {state === "vide" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUp />
            </EmptyMedia>
            <EmptyTitle>Pas encore de quoi mesurer</EmptyTitle>
            <EmptyDescription>
              La force, la dose par muscle et la régularité apparaissent après quelques séances.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {state === "nominal" &&
        (routine ? (
          <RoutineProgress routineId={routine} period={period} onRoutine={setRoutine} />
        ) : (
          <ProgressView sessions={sessions} period={period} />
        ))}
    </Page>
  );
}
