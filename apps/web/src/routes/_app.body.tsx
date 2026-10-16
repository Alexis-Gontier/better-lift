import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { useTab } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { BODY_TABS, BodyView } from "@/features/body/body-view";

export const Route = createFileRoute("/_app/body")({
  staticData: { crumb: "Corps" },
  component: BodyPage,
});

function BodyPage() {
  const tab = useTab(BODY_TABS.map((t) => t.value));
  const { state, variant } = useProto();
  if (state === "nominal") return <BodyView tab={tab} side={variant !== "a"} />;
  return (
    <BodyView tab={tab}>
      {state === "chargement" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {["a", "b", "c"].map((k) => (
              <Skeleton key={k} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </>
      )}
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
        </Empty>
      )}
    </BodyView>
  );
}
