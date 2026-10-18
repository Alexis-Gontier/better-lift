import { Link } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatKg, formatMinutes, formatNumber, formatShortDay } from "@/lib/format";
import { exerciseBySlug } from "@/mocks/exercises";
import { sessionDetail } from "@/mocks/history";
import { inPeriod, type Period } from "@/mocks/progress";
import { routineLifts, routineRuns, runFrequency } from "@/mocks/routine-history";
import { useRoutines } from "@/mocks/routine-store";
import { useSessions } from "@/mocks/session-store";
import { TODAY } from "@/mocks/today";

const volumeConfig = {
  volume: { label: "Volume", color: "var(--foreground)" },
} satisfies ChartConfig;
const pct = (n: number) => `${Math.round(n * 100)} %`;
const signedPct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatNumber(Math.abs(n))} %`;

/**
 * Une routine dans le temps (D279) : sa fréquence, son volume, sa durée et ses records séance par
 * séance, sa réalisation, et l'exercice qui la tire ou celui qui stagne.
 */
export function RoutineProgress({
  routineId,
  period,
  onRoutine,
}: {
  routineId: string;
  period: Period;
  onRoutine: (id: string) => void;
}) {
  const routines = useRoutines();
  const routine = routines.find((r) => r.id === routineId) ?? routines[0];
  const details = inPeriod(useSessions(), period, TODAY).map(sessionDetail);
  if (!routine) return null;
  const runs = routineRuns(routine, details);
  const freq = runFrequency(runs);
  const lifts = routineLifts(routine, details);
  const avg = (f: (r: (typeof runs)[number]) => number) =>
    runs.length ? runs.reduce((n, r) => n + f(r), 0) / runs.length : 0;
  const figures = [
    {
      label: "Séances",
      value: String(freq.count),
      hint: freq.avgGapDays ? `tous les ${freq.avgGapDays} j en moyenne` : "sur la période",
    },
    {
      label: "Durée moyenne",
      value: formatMinutes(Math.round(avg((r) => r.minutes))),
      hint: "par séance",
    },
    { label: "Réalisation", value: pct(avg((r) => r.completion)), hint: "séries faites / prévues" },
    {
      label: "Records",
      value: String(runs.reduce((n, r) => n + r.records, 0)),
      hint: "battus dans cette routine",
    },
  ];
  return (
    <>
      <Select value={routine.id} onValueChange={onRoutine}>
        <SelectTrigger aria-label="Routine" className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {routines.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {runs.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
          « {routine.name} » n'a pas été faite sur la période.
        </p>
      ) : (
        <>
          <Card size="sm">
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 @3xl:grid-cols-4">
              {figures.map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground text-xs">{f.label}</span>
                  <span className="font-semibold text-2xl tabular-nums">{f.value}</span>
                  <span className="text-muted-foreground text-xs">{f.hint}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Volume par séance</CardTitle>
              <CardDescription>Charge × répétitions des séries faites</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={volumeConfig} className="aspect-auto h-56 w-full">
                <LineChart data={runs} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortDay}
                    minTickGap={32}
                  />
                  <YAxis tickLine={false} axisLine={false} width={48} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(d) => formatShortDay(String(d))}
                        formatter={(v) => formatKg(Number(v))}
                      />
                    }
                  />
                  <Line
                    dataKey="volume"
                    type="monotone"
                    stroke="var(--color-volume)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <div className="grid items-start gap-4 @4xl:grid-cols-2">
            <Card className="gap-0 pb-0">
              <CardHeader className="pb-3">
                <CardTitle>Par exercice</CardTitle>
                <CardDescription>
                  Meilleure série (1RM estimé), première et dernière séance
                </CardDescription>
              </CardHeader>
              {lifts.map((l) => (
                <Link
                  key={l.slug}
                  to="/exercises/$slug"
                  params={{ slug: l.slug }}
                  className="flex items-center gap-3 border-t px-4 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {exerciseBySlug(l.slug)?.name ?? l.slug}
                  </span>
                  <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                    {l.points.at(-1)
                      ? formatKg(Math.round(l.points.at(-1)?.value ?? 0))
                      : "sans charge"}
                  </span>
                  <Badge variant="outline" className="w-16 shrink-0 justify-center tabular-nums">
                    {l.change === null ? "—" : signedPct(l.change)}
                  </Badge>
                </Link>
              ))}
            </Card>
            <Card className="gap-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Séance</TableHead>
                    <TableHead className="text-right">Durée</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead className="pr-4 text-right">Réalisation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...runs].reverse().map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4">
                        <Link to="/history/$id" params={{ id: r.id }} className="hover:underline">
                          {formatShortDay(r.date)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMinutes(r.minutes)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatKg(r.volume)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.records || "—"}</TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">
                        {pct(r.completion)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
