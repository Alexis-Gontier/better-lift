import { X } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { filled } from "@/features/routines/routine-editor";
import {
  formatKg,
  formatNumber,
  formatPrecise,
  formatShortDay,
  formatWeekdayDay,
} from "@/lib/format";
import { parseKg } from "@/lib/parse";
import { cn } from "@/lib/utils";
import { averageDelta, goalEta, relativeStrength, WEIGHT_GOAL, weightAt } from "@/mocks/body";
import { exerciseHistory } from "@/mocks/exercise-history";
import { best1rmOf } from "@/mocks/exercise-stats";
import { exerciseBySlug } from "@/mocks/exercises";
import { usePins } from "@/mocks/pins";
import { inPeriod, type Period, periodStart } from "@/mocks/progress";
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

/** La pesée du jour : là dès l'état vide, pour la première pesée. */
export function EntryDialog({
  open,
  onOpenChange,
  onWeight,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onWeight: (kg: number) => void;
}) {
  const [value, setValue] = useState("");
  const number = parseKg(value);
  const valid = number !== null && number > 0;
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
          <DialogTitle>Noter mon poids</DialogTitle>
          <DialogDescription>Pour aujourd'hui, {formatWeekdayDay(TODAY)}.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="entry-value">Poids (kg)</FieldLabel>
            <Input
              id="entry-value"
              inputMode="decimal"
              autoFocus
              placeholder="79,4"
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
              onWeight(number);
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
 * La force rapportée au poids (D281) : pour chaque exercice épinglé chargé, le meilleur 1RM estimé
 * divisé par le poids moyen, aujourd'hui et au début de la période.
 */
function RelativeStrength({ weights, period }: { weights: Weighing[]; period: Period }) {
  const { slugs } = usePins();
  const start = periodStart(period, TODAY);
  const nowWeight = weightAt(weights, TODAY);
  const thenWeight = weightAt(weights, start);
  const rows = slugs.flatMap((slug) => {
    const history = exerciseHistory(slug);
    const best = (until: string) =>
      Math.max(0, ...history.filter((p) => p.date <= until).map(best1rmOf));
    const now = nowWeight ? relativeStrength(best(TODAY), nowWeight) : 0;
    if (now === 0) return [];
    const then = thenWeight ? relativeStrength(best(start), thenWeight) : 0;
    return [
      { slug, name: exerciseBySlug(slug)?.name ?? slug, now, delta: then > 0 ? now - then : null },
    ];
  });
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="pb-3">
        <CardTitle>Force relative</CardTitle>
        <CardDescription>1RM estimé des épinglés, en fois le poids de corps</CardDescription>
      </CardHeader>
      {rows.length === 0 ? (
        <p className="border-t px-4 py-6 text-center text-muted-foreground text-sm">
          Épinglez un exercice chargé pour voir sa force relative.
        </p>
      ) : (
        rows.map((r) => (
          <div key={r.slug} className="flex items-center gap-3 border-t px-4 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm">{r.name}</span>
            <span className="shrink-0 font-medium text-sm tabular-nums">
              {formatPrecise(r.now)} × PDC
            </span>
            <span className="w-24 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
              {r.delta === null ? "—" : `${signed(r.delta, "")} sur la période`}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}

/**
 * Corps (D281), une seule page : à gauche le poids (bandeau, courbe sur la période) puis la force
 * relative ; à droite le journal des pesées. Le wireframe tient tout en mémoire.
 */
export function BodyView({
  period,
  entering,
  onEntering,
}: {
  period: Period;
  entering: boolean;
  onEntering: (open: boolean) => void;
}) {
  const [weights, setWeights] = useState<Weighing[]>(mockWeights);
  const addWeight = (kg: number) => {
    setWeights((w) => [...w.filter((x) => x.date !== TODAY), { date: TODAY, kg }]);
    toast.success(`${formatKg(kg)} noté pour aujourd'hui`);
  };
  return (
    <>
      <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <WeightFigures weights={weights} />
          <WeightChart weights={weights} period={period} />
          <RelativeStrength weights={weights} period={period} />
        </div>
        <WeightJournal weights={weights} onChange={setWeights} />
      </div>
      <EntryDialog open={entering} onOpenChange={onEntering} onWeight={addWeight} />
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
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-[36rem] rounded-xl" />
    </div>
  );
}
