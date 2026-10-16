import { Link } from "@tanstack/react-router";
import { Line, LineChart, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { formatKg, formatNumber } from "@/lib/format";
import { movingAverage } from "@/mocks/stats";
import { mockWeights } from "@/mocks/weights";

const config = { avg: { label: "Moyenne 7 jours", color: "var(--chart-3)" } } satisfies ChartConfig;

export function WeightCard() {
  const averages = movingAverage(
    mockWeights.map((w) => w.kg),
    7,
  );
  const last = averages.at(-1) ?? 0;
  const weekAgo = averages.at(-8) ?? last;
  const diff = last - weekAgo;
  const data = averages.slice(-30).map((avg, i) => ({ i, avg }));
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Poids</CardTitle>
        <CardDescription>Moyenne sur 7 jours</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link to="/body">Noter</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-3xl tabular-nums">{formatKg(last)}</span>
          <Badge variant="outline" className="tabular-nums">
            {Math.abs(diff) < 0.05
              ? "stable sur 7 j"
              : `${diff > 0 ? "+" : "−"}${formatNumber(Math.abs(diff))} kg sur 7 j`}
          </Badge>
        </div>
        <ChartContainer config={config} className="aspect-auto h-24 w-full">
          <LineChart data={data}>
            <YAxis hide domain={["dataMin - 0.3", "dataMax + 0.3"]} />
            <Line
              dataKey="avg"
              type="monotone"
              stroke="var(--color-avg)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
