import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
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
import { RecordsSkeleton, RecordsView } from "@/features/records/records-view";
import type { Period } from "@/mocks/progress";

export const Route = createFileRoute("/_app/records")({
  staticData: { crumb: "Records" },
  component: RecordsPage,
});

function RecordsPage() {
  const { state } = useProto();
  const [period, setPeriod] = useState<Period>("3m");
  return (
    <Page title="Records" actions={<PeriodToggle all value={period} onChange={setPeriod} />}>
      {state === "chargement" && <RecordsSkeleton />}
      {state === "erreur" && <StateError title="Les records n'ont pas pu se charger" />}
      {state === "vide" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>Pas encore de record</EmptyTitle>
            <EmptyDescription>
              Un record se bat dès la deuxième séance d'un exercice : la première sert de repère.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {state === "nominal" && <RecordsView period={period} />}
    </Page>
  );
}
