import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressCharts } from "@/features/progress/progress-charts";
import { RecordsTable } from "@/features/progress/records-table";
import { PERIODS, type Period } from "@/mocks/progress";

export const Route = createFileRoute("/_app/progress")({
  staticData: {
    crumb: "Progression",
    proto: {
      variants: [
        { value: "a", label: "Grille" },
        { value: "b", label: "Un graphique" },
      ],
    },
  },
  component: ProgressPage,
});

const TABS = [
  { value: "graphiques", label: "Graphiques" },
  { value: "records", label: "Records" },
] as const;

function ProgressPage() {
  const tab = useTab(TABS.map((t) => t.value));
  const { state, variant } = useProto();
  const [period, setPeriod] = useState<Period>("3m");
  return (
    <Page
      title="Progression"
      tabs={<PageTabs tabs={TABS} />}
      actions={
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-40" aria-label="Période">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      }
    >
      {state === "chargement" && (
        <div className="grid gap-4 md:grid-cols-2">
          {["a", "b", "c", "d"].map((k) => (
            <Skeleton key={k} className="h-80 rounded-xl" />
          ))}
        </div>
      )}
      {state === "erreur" && <StateError title="La progression n'a pas pu se charger" />}
      {state === "vide" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUp />
            </EmptyMedia>
            <EmptyTitle>Pas encore de quoi mesurer</EmptyTitle>
            <EmptyDescription>
              Les graphiques et les records apparaissent après quelques séances.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {state === "nominal" && tab === "graphiques" && (
        <ProgressCharts period={period} single={variant !== "a"} />
      )}
      {state === "nominal" && tab === "records" && <RecordsTable period={period} />}
    </Page>
  );
}
