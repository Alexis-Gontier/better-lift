import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatKg, formatShortDay } from "@/lib/format";
import { mockSessions } from "@/mocks/sessions";
import { weeklyVolume } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

const config = { volume: { label: "Volume", color: "var(--chart-2)" } } satisfies ChartConfig;

export function WeeklyVolumeChart() {
  const data = weeklyVolume(mockSessions, TODAY, 12);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Volume par semaine</CardTitle>
        <CardDescription>12 dernières semaines</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={config} className="h-56 w-full">
          <BarChart data={data} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShortDay}
              interval={1}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => `${Math.round(v / 1000)} t`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(w) => `Semaine du ${formatShortDay(String(w))}`}
                  formatter={(v) => formatKg(Number(v))}
                />
              }
            />
            <Bar dataKey="volume" fill="var(--color-volume)" radius={4} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
