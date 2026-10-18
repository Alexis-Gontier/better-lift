import { createFileRoute } from "@tanstack/react-router";
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
import { PeriodToggle } from "@/features/progress/period-toggle";
import { ProgressSkeleton, ProgressView } from "@/features/progress/progress-view";
import type { Period } from "@/mocks/progress";
import { useSessions } from "@/mocks/session-store";

export const Route = createFileRoute("/_app/progress")({
  staticData: { crumb: "Progression" },
  component: ProgressPage,
});

function ProgressPage() {
  const { state } = useProto();
  const sessions = useSessions();
  const [period, setPeriod] = useState<Period>("3m");
  return (
    <Page title="Progression" actions={<PeriodToggle value={period} onChange={setPeriod} />}>
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
      {state === "nominal" && <ProgressView sessions={sessions} period={period} />}
    </Page>
  );
}
