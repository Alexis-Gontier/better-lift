import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { Page } from "@/components/page";
import { PageTabs } from "@/components/page-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { formatKg, formatNumber, formatShortDay, formatWeekdayDay } from "@/lib/format";
import { averageDelta, type Measurement, mockMeasurements, WEIGHT_GOAL } from "@/mocks/body";
import { movingAverage } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";
import { mockWeights } from "@/mocks/weights";

export const BODY_TABS = [
  { value: "poids", label: "Poids" },
  { value: "mensurations", label: "Mensurations" },
] as const;
type Tab = (typeof BODY_TABS)[number]["value"];
type Weighing = { date: string; kg: number };

const weightConfig = {
  kg: { label: "Pesée", color: "var(--muted-foreground)" },
  avg: { label: "Moyenne 7 jours", color: "var(--chart-2)" },
} satisfies ChartConfig;

const signed = (n: number, unit: string) =>
  Math.abs(n) < 0.05 ? "stable" : `${n > 0 ? "+" : "−"}${formatNumber(Math.abs(n))} ${unit}`;

/** A : courbe pleine largeur, tableau dessous. B (`side`) : tableau à gauche, courbe à droite. */
function WeightPanel({ weights, side = false }: { weights: Weighing[]; side?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const avg = movingAverage(
    weights.map((w) => w.kg),
    7,
  );
  const current = avg.at(-1) ?? 0;
  const data = weights.map((w, i) => ({
    date: w.date,
    kg: w.kg,
    avg: Math.round((avg[i] ?? 0) * 10) / 10,
  }));
  const tiles = [
    {
      label: "Moyenne sur 7 jours",
      value: formatKg(Math.round(current * 10) / 10),
      hint: `${signed(averageDelta(weights, 7), "kg")} en 7 j`,
    },
    {
      label: "Sur 30 jours",
      value: signed(averageDelta(weights, 30), "kg"),
      hint: "écart de la moyenne",
    },
    {
      label: "Objectif",
      value: formatKg(WEIGHT_GOAL),
      hint: `encore ${formatNumber(Math.max(0, Math.round((current - WEIGHT_GOAL) * 10) / 10))} kg`,
    },
  ];
  const rows = [...data].reverse();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label} size="sm">
            <CardHeader>
              <CardDescription>{t.label}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <span className="font-semibold text-2xl tabular-nums">{t.value}</span>
              <span className="text-muted-foreground text-xs">{t.hint}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {side ? (
        // Variante B : le tableau à gauche, la courbe à droite.
        <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="flex flex-col gap-4">
            <Card className="gap-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Date</TableHead>
                    <TableHead className="text-right">Pesée</TableHead>
                    <TableHead className="pr-4 text-right">Moyenne 7 jours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(showAll ? rows : rows.slice(0, 10)).map((r) => (
                    <TableRow key={r.date}>
                      <TableCell className="pl-4 first-letter:uppercase">
                        {formatWeekdayDay(r.date)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatKg(r.kg)}</TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">
                        {formatKg(r.avg)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            {!showAll && rows.length > 10 && (
              <Button variant="outline" className="self-center" onClick={() => setShowAll(true)}>
                Afficher les {rows.length} pesées
              </Button>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Évolution</CardTitle>
              <CardDescription>
                Les pesées en points, la moyenne sur 7 jours en trait, l'objectif en pointillés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={weightConfig} className="aspect-auto h-72 w-full">
                <LineChart data={data} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortDay}
                    minTickGap={40}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    domain={[WEIGHT_GOAL - 1, "dataMax + 0.5"]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(d) => formatShortDay(String(d))}
                        formatter={(v, name) => (
                          <span className="flex w-full justify-between gap-4">
                            <span className="text-muted-foreground">
                              {weightConfig[name as keyof typeof weightConfig]?.label}
                            </span>
                            <span className="tabular-nums">{formatKg(Number(v))}</span>
                          </span>
                        )}
                      />
                    }
                  />
                  <ReferenceLine
                    y={WEIGHT_GOAL}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                  />
                  <Line
                    dataKey="kg"
                    stroke="none"
                    dot={{ r: 2, fill: "var(--color-kg)", fillOpacity: 0.5 }}
                    isAnimationActive={false}
                  />
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
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Évolution</CardTitle>
              <CardDescription>
                Les pesées en points, la moyenne sur 7 jours en trait, l'objectif en pointillés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={weightConfig} className="aspect-auto h-72 w-full">
                <LineChart data={data} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortDay}
                    minTickGap={40}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    domain={[WEIGHT_GOAL - 1, "dataMax + 0.5"]}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(d) => formatShortDay(String(d))}
                        formatter={(v, name) => (
                          <span className="flex w-full justify-between gap-4">
                            <span className="text-muted-foreground">
                              {weightConfig[name as keyof typeof weightConfig]?.label}
                            </span>
                            <span className="tabular-nums">{formatKg(Number(v))}</span>
                          </span>
                        )}
                      />
                    }
                  />
                  <ReferenceLine
                    y={WEIGHT_GOAL}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                  />
                  <Line
                    dataKey="kg"
                    stroke="none"
                    dot={{ r: 2, fill: "var(--color-kg)", fillOpacity: 0.5 }}
                    isAnimationActive={false}
                  />
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
          <Card className="gap-0 py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead className="text-right">Pesée</TableHead>
                  <TableHead className="pr-4 text-right">Moyenne 7 jours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showAll ? rows : rows.slice(0, 10)).map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="pl-4 first-letter:uppercase">
                      {formatWeekdayDay(r.date)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatKg(r.kg)}</TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">
                      {formatKg(r.avg)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          {!showAll && rows.length > 10 && (
            <Button variant="outline" className="self-center" onClick={() => setShowAll(true)}>
              Afficher les {rows.length} pesées
            </Button>
          )}
        </>
      )}
    </>
  );
}

function MeasurementCard({ m }: { m: Measurement }) {
  const last = m.points.at(-1)?.value ?? 0;
  const first = m.points[0]?.value ?? last;
  const config = { value: { label: m.label, color: "var(--chart-2)" } } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardDescription>{m.label}</CardDescription>
        <CardTitle className="flex items-baseline gap-2">
          <span className="text-2xl tabular-nums">
            {formatNumber(last)} {m.unit}
          </span>
          <Badge variant="outline" className="tabular-nums">
            {signed(last - first, m.unit)} en 6 mois
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-28 w-full">
          <LineChart data={m.points} margin={{ left: 0, right: 8 }}>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShortDay}
              minTickGap={24}
            />
            <YAxis hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(d) => formatShortDay(String(d))}
                  formatter={(v) => `${formatNumber(Number(v))} ${m.unit}`}
                />
              }
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function EntryDialog({
  tab,
  open,
  onOpenChange,
  onWeight,
  onMeasure,
}: {
  tab: Tab;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onWeight: (kg: number) => void;
  onMeasure: (id: string, value: number) => void;
}) {
  const [value, setValue] = useState("");
  const [measure, setMeasure] = useState(mockMeasurements[0]?.id ?? "bras");
  const number = Number(value.replace(",", "."));
  const valid = value !== "" && Number.isFinite(number) && number > 0;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setValue("");
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tab === "poids" ? "Noter mon poids" : "Noter une mesure"}</DialogTitle>
          <DialogDescription>Pour aujourd'hui, {formatWeekdayDay(TODAY)}.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          {tab === "mensurations" && (
            <Field>
              <FieldLabel htmlFor="measure-kind">Mesure</FieldLabel>
              <Select value={measure} onValueChange={setMeasure}>
                <SelectTrigger id="measure-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {mockMeasurements.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="entry-value">
              {tab === "poids" ? "Poids (kg)" : "Valeur (cm)"}
            </FieldLabel>
            <Input
              id="entry-value"
              inputMode="decimal"
              placeholder={tab === "poids" ? "79,4" : "38,5"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              if (tab === "poids") onWeight(number);
              else onMeasure(measure, number);
              setValue("");
              onOpenChange(false);
            }}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Corps tient ses pesées et mesures en mémoire : pas d'API dans le wireframe. */
export function BodyView({
  tab,
  side = false,
  children,
}: {
  tab: Tab;
  side?: boolean;
  children?: React.ReactNode;
}) {
  const [weights, setWeights] = useState<Weighing[]>(mockWeights);
  const [measurements, setMeasurements] = useState(mockMeasurements);
  const [entering, setEntering] = useState(false);

  const addWeight = (kg: number) =>
    setWeights((w) => [...w.filter((x) => x.date !== TODAY), { date: TODAY, kg }]);
  const addMeasure = (id: string, value: number) =>
    setMeasurements((ms) =>
      ms.map((m) =>
        m.id === id
          ? { ...m, points: [...m.points.filter((p) => p.date !== TODAY), { date: TODAY, value }] }
          : m,
      ),
    );

  return (
    <Page
      title="Corps"
      tabs={<PageTabs tabs={BODY_TABS} />}
      actions={
        <Button onClick={() => setEntering(true)}>
          {tab === "poids" ? "Noter mon poids" : "Noter une mesure"}
        </Button>
      }
    >
      {children ??
        (tab === "poids" ? (
          <WeightPanel weights={weights} side={side} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {measurements.map((m) => (
              <MeasurementCard key={m.id} m={m} />
            ))}
          </div>
        ))}
      <EntryDialog
        tab={tab}
        open={entering}
        onOpenChange={setEntering}
        onWeight={addWeight}
        onMeasure={addMeasure}
      />
    </Page>
  );
}
