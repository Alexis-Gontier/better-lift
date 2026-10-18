import { Link } from "@tanstack/react-router";
import { Line, LineChart, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { formatDaysAgo, formatKg } from "@/lib/format";
import { best1rmOf } from "@/mocks/exercise-stats";
import { topSet } from "@/mocks/record-insights";
import { daysSince } from "@/mocks/routine-stats";
import { addDays } from "@/mocks/stats";
import { targetOf } from "@/mocks/targets";
import { TODAY } from "@/mocks/today";
import type { Insight } from "../records/insights";
import { PinButton } from "../records/pin-button";
import { setText } from "../records/record-row";

const config = { value: { label: "1RM estimé", color: "var(--foreground)" } } satisfies ChartConfig;

/**
 * Un exercice épinglé (D277 A) : son meilleur 1RM estimé, sa courbe sur 3 mois, la dernière fois
 * et ce qu'il faut pour le prochain record — ou sa cible.
 */
export function LiftCard({ insight }: { insight: Insight }) {
  const last = insight.history.at(-1);
  const top = last && topSet(last);
  const charged = insight.best1rm > 0;
  const points = insight.history
    .filter((p) => p.date >= addDays(TODAY, -91))
    .map((p) => ({ date: p.date, value: best1rmOf(p) }));
  const target = targetOf(insight.slug);
  return (
    <Card size="sm" className="gap-2 px-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/exercises/$slug"
          params={{ slug: insight.slug }}
          className="min-w-0 hover:underline"
        >
          <span className="block truncate font-medium" title={insight.name}>
            {insight.name}
          </span>
          <span className="text-muted-foreground text-xs">{insight.muscle}</span>
        </Link>
        <PinButton slug={insight.slug} className="-mt-1 -mr-2 shrink-0" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-2xl tabular-nums">
          {charged
            ? formatKg(Math.round(insight.best1rm))
            : `${Math.max(...insight.history.flatMap((p) => p.sets.map((s) => s.reps)))} reps`}
        </span>
        <span className="text-muted-foreground text-xs">{charged ? "1RM estimé" : "record"}</span>
      </div>
      {charged && points.length > 1 && (
        <ChartContainer config={config} className="aspect-auto h-10 w-full">
          <LineChart data={points} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
            <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      )}
      <div className="flex flex-col gap-0.5 text-xs">
        {last && top && (
          <span className="text-muted-foreground tabular-nums">
            {setText(top)} · {formatDaysAgo(daysSince(last.date, TODAY)).toLowerCase()}
          </span>
        )}
        {insight.reach ? (
          <span className="font-medium tabular-nums">
            {setText(insight.reach.target)} bat ton record
          </span>
        ) : target !== undefined ? (
          <span className="tabular-nums">Cible {formatKg(target)}</span>
        ) : null}
      </div>
    </Card>
  );
}
