import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  formatKg,
  formatMonth,
  formatNumber,
  formatShortDay,
  formatShortMonth,
  plural,
} from "@/lib/format";

type Point = { debut: string; seances: number; volumeKg: number };
type Mesure = "seances" | "volumeKg";

const chartConfig = {
  seances: { label: "Séances", color: "var(--chart-2)" },
  volumeKg: { label: "Volume", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** « 12 t » au lieu de « 12 000 kg » : l'axe reste étroit. */
const tonnes = (kg: number) =>
  kg >= 1000 ? `${formatNumber(Math.round(kg / 1000))} t` : formatKg(kg);

/**
 * La tendance (D330) : un point par semaine, ou par mois sur un an, en aire. L'aire lit
 * l'évolution d'un coup d'œil ; un intervalle vide tombe à zéro, il se voit.
 */
export function TrendChart({
  points,
  unite,
  className,
}: {
  points: Point[];
  unite: "semaine" | "mois";
  className?: string;
}) {
  const [mesure, setMesure] = useState<Mesure>("seances");
  const date = (d: string) =>
    unite === "mois" ? formatShortMonth(d.slice(0, 7)) : formatShortDay(d);
  const total = points.reduce((n, p) => n + p[mesure], 0);
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Tendance</CardTitle>
        <CardAction>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={mesure}
            onValueChange={(v) => v && setMesure(v as Mesure)}
            aria-label="Mesure du graphique"
          >
            <ToggleGroupItem value="seances">Séances</ToggleGroupItem>
            <ToggleGroupItem value="volumeKg">Volume</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={points} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              {/* Le dégradé suit la couleur de la série, donc le thème. */}
              <linearGradient id="tendance-aire" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${mesure})`} stopOpacity={0.5} />
                <stop offset="95%" stopColor={`var(--color-${mesure})`} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="debut"
              tickLine={false}
              axisLine={false}
              tickFormatter={date}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              allowDecimals={false}
              tickFormatter={mesure === "volumeKg" ? tonnes : formatNumber}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, p) => {
                    const d = String(p[0]?.payload?.debut ?? "");
                    return unite === "mois"
                      ? formatMonth(d.slice(0, 7))
                      : `Semaine du ${formatShortDay(d)}`;
                  }}
                  formatter={(v) =>
                    mesure === "volumeKg" ? formatKg(Number(v)) : plural(Number(v), "séance")
                  }
                />
              }
            />
            <Area
              dataKey={mesure}
              // Monotone : la courbe ne passe jamais sous zéro entre deux points.
              type="monotone"
              stroke={`var(--color-${mesure})`}
              strokeWidth={2}
              fill="url(#tendance-aire)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
        <p className="sr-only">
          {mesure === "volumeKg"
            ? `Volume total sur la période : ${formatKg(total)}.`
            : `Séances sur la période : ${total}.`}
        </p>
      </CardContent>
    </Card>
  );
}
