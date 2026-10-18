import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { weeklyGoal } from "@/features/settings/training-settings";
import { formatMinutes, formatNumber, formatShortDay, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { comparedPeriods, goalStreak, weeklyTotals, weekStart } from "@/mocks/dashboard";
import type { MockSession } from "@/mocks/sessions";
import { addDays } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";
import { Sparkline } from "./sparkline";

/** La période des cartes, comparée à la même juste avant ; la tendance, sur douze semaines. */
const DAYS = 28;
const TREND_WEEKS = 12;
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

type Metric = {
  label: string;
  /** Le chiffre, et son unité à part (« 47,5 » « t »). */
  value: string;
  unit?: string;
  /** L'écart à la période d'avant, et son unité (« % ») ; absent sans période d'avant. */
  diff?: number;
  diffUnit?: string;
  foot: ReactNode;
  trend: number[];
  trendKind: "bars" | "area";
};

type Week = {
  goal: number | null;
  done: number;
  streak: number;
  days: { date: string; done: boolean; today: boolean; future: boolean }[];
};

/** Tout ce que montrent les cartes, calculé une fois pour les trois variantes. */
function figures(sessions: MockSession[]): { week: Week; metrics: Metric[] } {
  const goal = weeklyGoal();
  const year = weeklyTotals(sessions, TODAY, 52);
  const trend = year.slice(-TREND_WEEKS);
  const monday = weekStart(TODAY);
  const days = WEEKDAYS.map((_, i) => {
    const date = addDays(monday, i);
    return {
      date,
      done: sessions.some((s) => s.date === date),
      today: date === TODAY,
      future: date > TODAY,
    };
  });
  const week: Week = {
    goal,
    done: year.at(-1)?.count ?? 0,
    streak: goal === null ? 0 : goalStreak(year, goal),
    days,
  };

  const { now, before } = comparedPeriods(sessions, TODAY, DAYS);
  const tons = (kg: number) => formatNumber(Math.round(kg / 100) / 10);
  const lastRecord = sessions.find((s) => s.records > 0);
  const metrics: Metric[] = [
    {
      label: "Volume",
      value: tons(now.volume),
      unit: "t",
      diff:
        before.volume > 0
          ? Math.round(((now.volume - before.volume) / before.volume) * 100)
          : undefined,
      diffUnit: " %",
      foot: `${tons(now.volume / 4)} t par semaine`,
      trend: trend.map((w) => w.volume),
      trendKind: "area",
    },
    {
      label: "Séances",
      value: String(now.count),
      diff: now.count - before.count,
      foot:
        now.count > 0
          ? `${formatNumber(now.count / 4)} par semaine · ${formatMinutes(Math.round(now.minutes / now.count))} en moyenne`
          : "Aucune séance",
      trend: trend.map((w) => w.count),
      trendKind: "bars",
    },
    {
      label: "Records",
      value: String(now.records),
      diff: now.records - before.records,
      foot: lastRecord ? (
        <Link
          to="/history/$id"
          params={{ id: lastRecord.id }}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Dernier : {lastRecord.routine}, {formatShortDay(lastRecord.date)}
        </Link>
      ) : (
        "Pas encore de record"
      ),
      trend: trend.map((w) => w.records),
      trendKind: "bars",
    },
  ];
  return { week, metrics };
}

const signOf = (diff: number) => (diff > 0 ? "+" : diff < 0 ? "−" : "±");

/** L'écart, flèche comprise : « ↗ +6 % ». Neutre : le wireframe n'a pas de couleur. */
function Delta({
  diff,
  unit = "",
  className,
}: {
  diff: number;
  unit?: string;
  className?: string;
}) {
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium text-xs tabular-nums",
        diff < 0 && "text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {signOf(diff)}
      {formatNumber(Math.abs(diff))}
      {unit}
    </span>
  );
}

/** Le chiffre d'une carte, son unité en retrait. */
function Figure({ value, unit, className }: { value: string; unit?: string; className?: string }) {
  return (
    <span className={cn("font-semibold tabular-nums tracking-tight", className)}>
      {value}
      {unit && <span className="ml-1 font-normal text-[0.5em] text-muted-foreground">{unit}</span>}
    </span>
  );
}

const weekFoot = (w: Week) =>
  w.goal === null ? (
    <Link to="/settings/training" className="underline-offset-4 hover:underline">
      Fixer un objectif par semaine
    </Link>
  ) : w.streak > 0 ? (
    `${plural(w.streak, "semaine")} d'affilée à l'objectif`
  ) : (
    "Aucune semaine d'affilée à l'objectif"
  );

const weekLine = (w: Week) =>
  w.goal === null
    ? "Pas d'objectif"
    : w.done >= w.goal
      ? "Objectif atteint"
      : `Encore ${plural(w.goal - w.done, "séance")}`;

/* ─────────────────────────── A · Bandeau ─────────────────────────── */

/** Un seul bloc, quatre cases séparées d'un filet ; la tendance en barres au pied de chaque case. */
function StatsStrip({ week, metrics }: { week: Week; metrics: Metric[] }) {
  const cell = "flex min-h-48 flex-col gap-3 bg-background p-5";
  const label = "font-medium text-muted-foreground text-xs uppercase tracking-wider";
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border bg-border @xl:grid-cols-2 @5xl:grid-cols-4">
      <div className={cell}>
        <div className="flex items-center justify-between">
          <span className={label}>Cette semaine</span>
          <span className="text-muted-foreground text-xs">{weekLine(week)}</span>
        </div>
        <Figure
          value={String(week.done)}
          unit={week.goal !== null ? `/ ${week.goal}` : undefined}
          className="text-4xl"
        />
        <div className="mt-auto flex flex-col gap-2">
          {week.goal !== null && (
            <div className="flex gap-1">
              {Array.from({ length: Math.max(week.goal, week.done) }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < week.done ? "bg-foreground" : "bg-muted",
                  )}
                />
              ))}
            </div>
          )}
          <span className="text-muted-foreground text-sm">{weekFoot(week)}</span>
        </div>
      </div>
      {metrics.map((m) => (
        <div key={m.label} className={cell}>
          <div className="flex items-center justify-between">
            <span className={label}>{m.label} · 4 sem.</span>
            {m.diff !== undefined && <Delta diff={m.diff} unit={m.diffUnit} />}
          </div>
          <Figure value={m.value} unit={m.unit} className="text-4xl" />
          <div className="mt-auto flex flex-col gap-2">
            <Sparkline values={m.trend} kind="bars" className="h-8 text-foreground" />
            <span className="truncate text-muted-foreground text-sm">{m.foot}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── B · Tuiles ─────────────────────────── */

/** Quatre tuiles pleines, sans bordure ; la tendance en aplat déborde au bas de chacune. */
function StatsTiles({ week, metrics }: { week: Week; metrics: Metric[] }) {
  const tile = "relative flex min-h-48 flex-col overflow-hidden rounded-2xl bg-muted/60 p-5";
  return (
    <div className="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-4">
      <div className={tile}>
        <span className="font-medium text-sm">Cette semaine</span>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <Figure
            value={String(week.done)}
            unit={week.goal !== null ? `/ ${week.goal}` : undefined}
            className="text-3xl"
          />
          <span className="text-muted-foreground text-xs">{weekLine(week)}</span>
        </div>
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div className="flex justify-between">
            {week.days.map((d, i) => (
              <span
                key={d.date}
                title={d.date}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full font-medium text-xs",
                  d.done
                    ? "bg-foreground text-background"
                    : d.future
                      ? "text-muted-foreground/50"
                      : "bg-background text-muted-foreground",
                  d.today && !d.done && "ring-1 ring-foreground",
                )}
              >
                {WEEKDAYS[i]}
              </span>
            ))}
          </div>
          <span className="text-muted-foreground text-xs">{weekFoot(week)}</span>
        </div>
      </div>
      {metrics.map((m) => (
        <div key={m.label} className={tile}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{m.label}</span>
            {m.diff !== undefined && (
              <Delta
                diff={m.diff}
                unit={m.diffUnit}
                className="rounded-full bg-background px-2 py-0.5"
              />
            )}
          </div>
          <Figure value={m.value} unit={m.unit} className="mt-1 text-3xl" />
          <span className="relative z-10 mt-1 text-muted-foreground text-xs">
            4 dernières semaines
          </span>
          <Sparkline
            values={m.trend}
            kind="area"
            className="-mx-5 -mb-5 mt-auto h-16 w-[calc(100%+2.5rem)] pt-4 text-foreground/70"
          />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── C · Éditorial ─────────────────────────── */

/** L'anneau de l'objectif : la part de la semaine faite. */
function GoalRing({ done, goal }: { done: number; goal: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const part = Math.min(1, done / goal);
  return (
    <svg viewBox="0 0 52 52" className="size-14 -rotate-90" aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--muted)" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${part * c} ${c}`}
      />
    </svg>
  );
}

/** Pas de boîte : un filet épais au-dessus de chaque colonne, des chiffres grands et fins. */
function StatsEditorial({ week, metrics }: { week: Week; metrics: Metric[] }) {
  const col = "flex flex-col gap-2 border-foreground border-t-2 pt-3";
  return (
    <div className="grid gap-x-8 gap-y-10 @xl:grid-cols-2 @5xl:grid-cols-4">
      <div className={col}>
        <span className="font-medium text-sm">Cette semaine</span>
        <div className="flex items-center justify-between gap-4">
          <Figure
            value={String(week.done)}
            unit={week.goal !== null ? `/ ${week.goal}` : undefined}
            className="font-light text-6xl"
          />
          {week.goal !== null && <GoalRing done={week.done} goal={week.goal} />}
        </div>
        <p className="text-sm">{weekLine(week)}</p>
        <p className="text-muted-foreground text-sm">{weekFoot(week)}</p>
      </div>
      {metrics.map((m) => (
        <div key={m.label} className={col}>
          <span className="font-medium text-sm">{m.label}, 4 semaines</span>
          <Figure value={m.value} unit={m.unit} className="font-light text-6xl" />
          <p className="text-sm">
            {m.diff === undefined ? (
              "Pas de période d'avant"
            ) : m.diff === 0 ? (
              "Autant que les 4 sem. d'avant"
            ) : (
              <>
                <Delta diff={m.diff} unit={m.diffUnit} className="text-sm" /> face aux 4 sem.
                d'avant
              </>
            )}
          </p>
          <p className="truncate text-muted-foreground text-sm">{m.foot}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * La rangée de tête (D287) : la semaine face à l'objectif, puis volume, séances et records des
 * quatre dernières semaines, chacun face aux quatre d'avant. Trois mises en forme à comparer.
 */
export function HomeStats({
  sessions,
  variant,
}: {
  sessions: MockSession[];
  variant: "a" | "b" | "c";
}) {
  const data = figures(sessions);
  if (variant === "b") return <StatsTiles {...data} />;
  if (variant === "c") return <StatsEditorial {...data} />;
  return <StatsStrip {...data} />;
}

/** L'Accueil pendant le chargement : la rangée de tête, le calendrier, les graphiques. */
export function HomeSkeleton() {
  return (
    <>
      <div className="grid gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <div className="grid gap-4 @4xl:grid-cols-3">
        <Skeleton className="h-80 rounded-xl @4xl:col-span-3" />
        <Skeleton className="h-80 rounded-xl @4xl:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </>
  );
}
