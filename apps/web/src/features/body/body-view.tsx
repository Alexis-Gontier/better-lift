import { Plus, X } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { filled } from "@/features/routines/routine-editor";
import { formatKg, formatNumber, formatShortDay, formatWeekdayDay } from "@/lib/format";
import { parseKg } from "@/lib/parse";
import { cn } from "@/lib/utils";
import {
  averageDelta,
  goalEta,
  type Measurement,
  mockMeasurements,
  WEIGHT_GOAL,
} from "@/mocks/body";
import { inPeriod, type Period } from "@/mocks/progress";
import { movingAverage } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";
import { mockWeights } from "@/mocks/weights";

type Weighing = { date: string; kg: number };

const weightConfig = {
  kg: { label: "Pesée", color: "var(--muted-foreground)" },
  avg: { label: "Moyenne 7 jours", color: "var(--foreground)" },
} satisfies ChartConfig;

const signed = (n: number, unit: string) =>
  Math.abs(n) < 0.05 ? "stable" : `${n > 0 ? "+" : "−"}${formatNumber(Math.abs(n))} ${unit}`;

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Le poids en bandeau (D268) : la moyenne sur 7 jours, la pente en kg par semaine, l'objectif
 * avec ce qui reste, sa barre de progression et la date estimée au rythme actuel.
 */
function WeightFigures({ weights }: { weights: Weighing[] }) {
  const avg = movingAverage(
    weights.map((w) => w.kg),
    7,
  );
  const current = avg.at(-1) ?? 0;
  const start = avg[6] ?? avg[0] ?? current;
  const perWeek = round1((averageDelta(weights, 28) / 28) * 7);
  const eta = goalEta(current, WEIGHT_GOAL, perWeek, TODAY);
  const done = start === WEIGHT_GOAL ? 100 : ((start - current) / (start - WEIGHT_GOAL)) * 100;
  return (
    <Card size="sm">
      <CardContent className="grid gap-x-6 gap-y-4 @xl:grid-cols-[1fr_1fr_minmax(0,1.5fr)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Moyenne sur 7 jours</span>
          <span className="font-semibold text-2xl tabular-nums">{formatKg(round1(current))}</span>
          <span className="text-muted-foreground text-xs">
            {signed(averageDelta(weights, 7), "kg")} en 7 jours
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Tendance</span>
          <span className="font-semibold text-2xl tabular-nums">{signed(perWeek, "kg")}</span>
          <span className="text-muted-foreground text-xs">par semaine, sur 4 semaines</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-muted-foreground text-xs">Objectif {formatKg(WEIGHT_GOAL)}</span>
            <span className="text-sm tabular-nums">
              encore {formatKg(Math.max(0, round1(current - WEIGHT_GOAL)))}
            </span>
          </span>
          <Progress value={Math.max(0, Math.min(100, done))} aria-label="Avancée vers l'objectif" />
          <span className="text-muted-foreground text-xs">
            {eta
              ? `Vers le ${formatShortDay(eta)} au rythme actuel`
              : "Pas de date : la tendance ne va pas vers l'objectif"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** La courbe du poids sur la période : les pesées en points, la moyenne en trait (D268). */
function WeightChart({ weights, period }: { weights: Weighing[]; period: Period }) {
  const avg = movingAverage(
    weights.map((w) => w.kg),
    7,
  );
  const data = inPeriod(
    weights.map((w, i) => ({ date: w.date, kg: w.kg, avg: round1(avg[i] ?? 0) })),
    period,
    TODAY,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution</CardTitle>
        <CardDescription>
          Les pesées en points, la moyenne sur 7 jours en trait, l'objectif en pointillés
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={weightConfig} className="aspect-auto h-64 w-full">
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
            <ReferenceLine y={WEIGHT_GOAL} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
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
  );
}

/** Une pesée du journal : sa valeur se corrige sur place, s'enregistre en quittant le champ. */
function JournalRow({
  weighing,
  average,
  onCommit,
  onRemove,
}: {
  weighing: Weighing;
  average: number;
  onCommit: (kg: number) => void;
  onRemove: () => void;
}) {
  const [text, setText] = useState(String(weighing.kg).replace(".", ","));
  const commit = () => {
    const kg = parseKg(text);
    if (kg === null || kg <= 0 || kg === weighing.kg) {
      setText(String(weighing.kg).replace(".", ","));
      return;
    }
    onCommit(kg);
  };
  return (
    <div className="flex items-center gap-2 border-t px-4 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm first-letter:uppercase">
        {formatWeekdayDay(weighing.date)}
      </span>
      <span className="hidden text-muted-foreground text-xs tabular-nums @[16rem]:inline">
        moy. {formatNumber(average)}
      </span>
      <Input
        aria-label={`Pesée du ${formatShortDay(weighing.date)}`}
        inputMode="decimal"
        className={cn("h-8 w-20 text-right tabular-nums", filled)}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Supprimer la pesée du ${formatShortDay(weighing.date)}`}
        className="text-muted-foreground/70 hover:text-foreground"
        onClick={onRemove}
      >
        <X />
      </Button>
    </div>
  );
}

/**
 * Le journal des pesées, dans la colonne de droite (D268) : la plus récente en tête, chacune
 * corrigeable sur place ou supprimable ; un toast propose d'annuler l'un comme l'autre.
 */
function WeightJournal({
  weights,
  onChange,
}: {
  weights: Weighing[];
  onChange: (next: Weighing[]) => void;
}) {
  const [all, setAll] = useState(false);
  const avg = movingAverage(
    weights.map((w) => w.kg),
    7,
  );
  const rows = weights.map((w, i) => ({ w, average: round1(avg[i] ?? w.kg) })).reverse();
  const shown = all ? rows : rows.slice(0, 14);
  const undoable = (message: string, next: Weighing[]) => {
    const before = weights;
    onChange(next);
    toast(message, { action: { label: "Annuler", onClick: () => onChange(before) } });
  };
  return (
    <Card size="sm" className="@container gap-0 pb-0">
      <CardHeader className="pb-3">
        <CardTitle>Journal</CardTitle>
        <CardDescription>{weights.length} pesées · corriger une valeur sur place</CardDescription>
      </CardHeader>
      {shown.map(({ w, average }) => (
        <JournalRow
          key={`${w.date}-${w.kg}`}
          weighing={w}
          average={average}
          onCommit={(kg) =>
            undoable(
              "Pesée corrigée",
              weights.map((x) => (x.date === w.date ? { ...x, kg } : x)),
            )
          }
          onRemove={() =>
            undoable(
              "Pesée supprimée",
              weights.filter((x) => x.date !== w.date),
            )
          }
        />
      ))}
      {!all && rows.length > shown.length && (
        <div className="border-t p-3">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setAll(true)}>
            Afficher les {rows.length} pesées
          </Button>
        </div>
      )}
    </Card>
  );
}

/** Une mesure : sa dernière valeur, son écart sur six mois et sa petite courbe. */
function MeasurementCard({ m }: { m: Measurement }) {
  const last = m.points.at(-1)?.value ?? 0;
  const first = m.points[0]?.value ?? last;
  const config = { value: { label: m.label, color: "var(--foreground)" } } satisfies ChartConfig;
  return (
    <Card size="sm" className="gap-2 px-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-muted-foreground text-xs">{m.label}</span>
          <span className="font-semibold text-xl tabular-nums">
            {formatNumber(last)} {m.unit}
          </span>
        </span>
        <Badge variant="outline" className="shrink-0 tabular-nums">
          {signed(last - first, m.unit)}
        </Badge>
      </div>
      <ChartContainer config={config} className="aspect-auto h-12 w-full">
        <LineChart data={m.points} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
          <YAxis hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, p) => formatShortDay(String(p[0]?.payload?.date ?? ""))}
                formatter={(v) => `${formatNumber(Number(v))} ${m.unit}`}
              />
            }
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={1.5}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
      <span className="text-muted-foreground text-xs">
        Mesurée le {formatShortDay(m.points.at(-1)?.date ?? TODAY)}, sur six mois
      </span>
    </Card>
  );
}

export type Entry = "poids" | "mesure";

/** La saisie du jour, pesée ou mesure : là dès l'état vide, pour la première pesée. */
export function EntryDialog({
  entry,
  onOpenChange,
  onWeight,
  onMeasure,
}: {
  entry: Entry | null;
  onOpenChange: (o: boolean) => void;
  onWeight: (kg: number) => void;
  onMeasure: (id: string, value: number) => void;
}) {
  const [value, setValue] = useState("");
  const [measure, setMeasure] = useState(mockMeasurements[0]?.id ?? "bras");
  const number = parseKg(value);
  const valid = number !== null && number > 0;
  return (
    <Dialog
      open={entry !== null}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setValue("");
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{entry === "mesure" ? "Noter une mesure" : "Noter mon poids"}</DialogTitle>
          <DialogDescription>Pour aujourd'hui, {formatWeekdayDay(TODAY)}.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          {entry === "mesure" && (
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
              {entry === "mesure" ? "Valeur (cm)" : "Poids (kg)"}
            </FieldLabel>
            <Input
              id="entry-value"
              inputMode="decimal"
              autoFocus
              placeholder={entry === "mesure" ? "38,5" : "79,4"}
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
              if (number === null) return;
              if (entry === "mesure") onMeasure(measure, number);
              else onWeight(number);
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

/**
 * Corps (D268), une seule page : à gauche le poids (bandeau, courbe sur la période) puis les
 * mensurations ; à droite le journal des pesées. Le wireframe tient tout en mémoire.
 */
export function BodyView({
  period,
  entry,
  onEntry,
}: {
  period: Period;
  entry: Entry | null;
  onEntry: (entry: Entry | null) => void;
}) {
  const [weights, setWeights] = useState<Weighing[]>(mockWeights);
  const [measurements, setMeasurements] = useState(mockMeasurements);

  const addWeight = (kg: number) => {
    setWeights((w) => [...w.filter((x) => x.date !== TODAY), { date: TODAY, kg }]);
    toast.success(`${formatKg(kg)} noté pour aujourd'hui`);
  };
  const addMeasure = (id: string, value: number) =>
    setMeasurements((ms) =>
      ms.map((m) =>
        m.id === id
          ? { ...m, points: [...m.points.filter((p) => p.date !== TODAY), { date: TODAY, value }] }
          : m,
      ),
    );

  return (
    <>
      <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <WeightFigures weights={weights} />
          <WeightChart weights={weights} period={period} />
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-medium text-lg">Mensurations</h2>
              <Button variant="outline" size="sm" onClick={() => onEntry("mesure")}>
                <Plus data-icon="inline-start" /> Noter une mesure
              </Button>
            </div>
            <div className="grid gap-3 @xl:grid-cols-2">
              {measurements.map((m) => (
                <MeasurementCard key={m.id} m={m} />
              ))}
            </div>
          </section>
        </div>
        <WeightJournal weights={weights} onChange={setWeights} />
      </div>
      <EntryDialog
        entry={entry}
        onOpenChange={(o) => !o && onEntry(null)}
        onWeight={addWeight}
        onMeasure={addMeasure}
      />
    </>
  );
}

/** La page pendant le chargement : bandeau, courbe et mesures à gauche, journal à droite. */
export function BodySkeleton() {
  return (
    <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
        <div className="grid gap-3 @xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-[36rem] rounded-xl" />
    </div>
  );
}
