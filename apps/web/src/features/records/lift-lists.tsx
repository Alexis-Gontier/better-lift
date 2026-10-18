import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDaysAgo, formatKg, formatNumber } from "@/lib/format";
import { daysSince } from "@/mocks/routine-stats";
import { TODAY } from "@/mocks/today";
import type { Insight } from "./insights";
import { setText } from "./record-row";

function LiftList({
  title,
  description,
  empty,
  items,
  limit,
  render,
}: {
  title: string;
  description: string;
  empty: string;
  items: Insight[];
  limit?: number;
  render: (i: Insight) => ReactNode;
}) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {shown.length === 0 ? (
        <p className="border-t px-4 py-6 text-center text-muted-foreground text-sm">{empty}</p>
      ) : (
        shown.map((i) => (
          <Link
            key={i.slug}
            to="/exercises/$slug"
            params={{ slug: i.slug }}
            className="flex items-center gap-3 border-t px-4 py-2.5 transition-colors hover:bg-muted/40"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{i.name}</span>
              <span className="text-muted-foreground text-xs">{i.muscle}</span>
            </span>
            {render(i)}
          </Link>
        ))
      )}
    </Card>
  );
}

/** Les records atteignables à la prochaine séance, avec la série qui suffit (D275). */
export function ReachList({ items, limit }: { items: Insight[]; limit?: number }) {
  return (
    <LiftList
      title="À portée"
      description="Une répétition ou 2,5 kg de plus suffisent"
      empty="Rien à portée pour l'instant."
      items={items.filter((i) => i.reach)}
      limit={limit}
      render={(i) => (
        <span className="flex shrink-0 flex-col items-end">
          <span className="font-medium text-sm tabular-nums">
            {i.reach && setText(i.reach.target)}
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {i.reach?.bodyweight
              ? `record ${i.reach.record} reps`
              : `bat ${formatKg(Math.round(i.reach?.record ?? 0))}`}
          </span>
        </span>
      )}
    />
  );
}

/** Le 1RM estimé en hausse sur quatre semaines, le plus fort d'abord (D275). */
export function TrendList({ items, limit }: { items: Insight[]; limit?: number }) {
  return (
    <LiftList
      title="En progression"
      description="1RM estimé sur 4 semaines"
      empty="Aucune hausse sur 4 semaines."
      items={items.filter((i) => (i.trend?.change ?? 0) > 0)}
      limit={limit}
      render={(i) => (
        <Badge variant="outline" className="shrink-0 tabular-nums">
          +{formatNumber(i.trend?.change ?? 0)} %
        </Badge>
      )}
    />
  );
}

/** Fait régulièrement, sans record depuis quatre semaines (D275). */
export function StalledList({ items, limit }: { items: Insight[]; limit?: number }) {
  return (
    <LiftList
      title="En stagnation"
      description="Fait souvent, sans record depuis 4 semaines"
      empty="Rien ne stagne."
      items={items.filter((i) => i.stalled)}
      limit={limit}
      render={(i) => (
        <span className="shrink-0 text-muted-foreground text-xs">
          {i.lastRecord
            ? `Dernier record ${formatDaysAgo(daysSince(i.lastRecord, TODAY)).toLowerCase()}`
            : "Jamais de record"}
        </span>
      )}
    />
  );
}
