import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Page } from "@/components/page";
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
import { BodySkeleton, BodyView, EntryDialog } from "@/features/body/body-view";
import { PeriodToggle } from "@/features/progress/period-toggle";
import { formatKg } from "@/lib/format";
import type { Period } from "@/mocks/progress";

export const Route = createFileRoute("/_app/body")({
  staticData: { crumb: "Corps" },
  component: BodyPage,
});

/** Corps (D281) : le poids, sur une page ; la période et la pesée en tête. */
function BodyPage() {
  const { state } = useProto();
  const [period, setPeriod] = useState<Period>("3m");
  const [entering, setEntering] = useState(false);
  return (
    <Page
      title="Corps"
      actions={
        <>
          <PeriodToggle value={period} onChange={setPeriod} />
          <Button size="sm" onClick={() => setEntering(true)}>
            Noter mon poids
          </Button>
        </>
      }
    >
      {state === "chargement" && <BodySkeleton />}
      {state === "erreur" && <StateError title="Les mesures n'ont pas pu se charger" />}
      {state === "vide" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Scale />
            </EmptyMedia>
            <EmptyTitle>Pas encore de pesée</EmptyTitle>
            <EmptyDescription>
              Notez votre poids le matin, à jeun : la moyenne sur 7 jours lissera les écarts d'un
              jour à l'autre.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setEntering(true)}>Noter mon poids</Button>
          </EmptyContent>
        </Empty>
      )}
      {state === "nominal" && (
        <BodyView period={period} entering={entering} onEntering={setEntering} />
      )}
      {/* Hors de l'état nominal, la saisie reste ouvrable : c'est la première pesée. */}
      {state !== "nominal" && (
        <EntryDialog
          open={entering}
          onOpenChange={setEntering}
          onWeight={(kg) => toast.success(`${formatKg(kg)} noté pour aujourd'hui`)}
        />
      )}
    </Page>
  );
}
