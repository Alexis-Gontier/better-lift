import { Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  Dumbbell,
  ListChecks,
  type LucideIcon,
  Minus,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { weeklyGoal } from "@/features/settings/training-settings";
import { formatMinutes, formatNumber, formatShortDay, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { comparedPeriods, goalStreak, weeklyTotals, weekStart } from "@/mocks/dashboard";
import type { MockSession } from "@/mocks/sessions";
import { addDays } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

/** La période des tuiles, comparée à la même juste avant. */
const DAYS = 28;
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

type Metric = {
  label: string;
  icon: LucideIcon;
  /** Le chiffre, et son unité à part (« 47,5 » « t »). */
  value: string;
  unit?: string;
  /** Le même chiffre sur les 4 semaines d'avant. */
  before: string;
  /** L'écart à la période d'avant, et son unité (« % ») ; absent sans période d'avant. */
  diff?: number;
  diffUnit?: string;
  foot: ReactNode;
  /** Le second repère de la variante B, à côté de la période d'avant. */
  aside: { label: string; value: ReactNode };
};

type Week = {
  goal: number | null;
  done: number;
  streak: number;
  days: { date: string; done: boolean; today: boolean; future: boolean }[];
};

/** Tout ce que montrent les tuiles, calculé une fois pour les trois variantes. */
function figures(sessions: MockSession[]): { week: Week; metrics: Metric[] } {
  const goal = weeklyGoal();
  const year = weeklyTotals(sessions, TODAY, 52);
  const monday = weekStart(TODAY);
  const week: Week = {
    goal,
    done: year.at(-1)?.count ?? 0,
    streak: goal === null ? 0 : goalStreak(year, goal),
    days: WEEKDAYS.map((_, i) => {
      const date = addDays(monday, i);
      return {
        date,
        done: sessions.some((s) => s.date === date),
        today: date === TODAY,
        future: date > TODAY,
      };
    }),
  };

  const { now, before } = comparedPeriods(sessions, TODAY, DAYS);
  const tons = (kg: number) => formatNumber(Math.round(kg / 100) / 10);
  const lastRecord = sessions.find((s) => s.records > 0);
  const metrics: Metric[] = [
    {
      label: "Volume",
      icon: Dumbbell,
      value: tons(now.volume),
      unit: "t",
      before: `${tons(before.volume)} t`,
      diff:
        before.volume > 0
          ? Math.round(((now.volume - before.volume) / before.volume) * 100)
          : undefined,
      diffUnit: " %",
      foot: `${tons(now.volume / 4)} t par semaine`,
      aside: { label: "Par semaine", value: `${tons(now.volume / 4)} t` },
    },
    {
      label: "Séances",
      icon: ListChecks,
      value: String(now.count),
      before: String(before.count),
      diff: now.count - before.count,
      foot:
        now.count > 0
          ? `${formatMinutes(Math.round(now.minutes / now.count))} en moyenne`
          : "Aucune séance",
      aside: {
        label: "Durée moyenne",
        value: now.count > 0 ? formatMinutes(Math.round(now.minutes / now.count)) : "—",
      },
    },
    {
      label: "Records",
      icon: Trophy,
      value: String(now.records),
      before: String(before.records),
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
      aside: {
        label: "Dernier",
        value: lastRecord ? formatShortDay(lastRecord.date) : "—",
      },
    },
  ];
  return { week, metrics };
}

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
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-background px-2 py-0.5 font-medium text-xs tabular-nums",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {sign}
      {formatNumber(Math.abs(diff))}
      {unit}
    </span>
  );
}

/** Le chiffre d'une tuile, son unité en retrait. */
function Figure({ value, unit, className }: { value: string; unit?: string; className?: string }) {
  return (
    <span className={cn("font-semibold tabular-nums tracking-tight", className)}>
      {value}
      {unit && <span className="ml-1 font-normal text-[0.55em] opacity-60">{unit}</span>}
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

/**
 * Les jours de la semaine, lundi d'abord : faits remplis, aujourd'hui cerclé, à venir effacés.
 * `inverse` : posés sur l'aplat sombre de la tuile de la semaine (variante B).
 */
function WeekDays({
  week,
  size = "md",
  inverse,
}: {
  week: Week;
  size?: "sm" | "md";
  inverse?: boolean;
}) {
  return (
    <div className="flex justify-between gap-1">
      {week.days.map((d, i) => (
        <span
          key={d.date}
          title={d.done ? `${formatShortDay(d.date)} · séance faite` : formatShortDay(d.date)}
          className={cn(
            "flex items-center justify-center rounded-full font-medium",
            size === "md" ? "size-7 text-xs" : "size-5 text-[0.65rem]",
            inverse
              ? d.done
                ? "bg-background text-foreground"
                : d.future
                  ? "text-background/40"
                  : "bg-background/15 text-background/70"
              : d.done
                ? "bg-foreground text-background"
                : d.future
                  ? "text-muted-foreground/50"
                  : "bg-background text-muted-foreground",
            d.today && !d.done && (inverse ? "ring-1 ring-background" : "ring-1 ring-foreground"),
          )}
        >
          {WEEKDAYS[i]}
        </span>
      ))}
    </div>
  );
}

const tile = "flex flex-col rounded-2xl bg-muted/60 p-5";
const grid = "grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-4";

/* ─────────────────────────── A · Sobre ─────────────────────────── */

/** Le chiffre en grand, l'écart en pastille, une ligne de contexte au pied. */
function TilesPlain({ week, metrics }: { week: Week; metrics: Metric[] }) {
  return (
    <div className={grid}>
      <div className={cn(tile, "min-h-44")}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Cette semaine</span>
          <span className="text-muted-foreground text-xs">{weekLine(week)}</span>
        </div>
        <Figure
          value={String(week.done)}
          unit={week.goal !== null ? `/ ${week.goal}` : undefined}
          className="mt-2 text-4xl"
        />
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <WeekDays week={week} />
          <span className="text-muted-foreground text-xs">{weekFoot(week)}</span>
        </div>
      </div>
      {metrics.map((m) => (
        <div key={m.label} className={cn(tile, "min-h-44")}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{m.label}</span>
            {m.diff !== undefined && <Delta diff={m.diff} unit={m.diffUnit} />}
          </div>
          <Figure value={m.value} unit={m.unit} className="mt-2 text-4xl" />
          <span className="mt-1 text-muted-foreground text-xs">4 dernières semaines</span>
          <span className="mt-auto truncate pt-4 text-muted-foreground text-sm">{m.foot}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── B · Avant / après ─────────────────────────── */

/** Sous le chiffre, les deux périodes côte à côte ; la semaine, en aplat inversé, ressort. */
function TilesCompare({ week, metrics }: { week: Week; metrics: Metric[] }) {
  return (
    <div className={grid}>
      <div className={cn(tile, "min-h-48 bg-foreground text-background")}>
        <span className="font-medium text-sm">Cette semaine</span>
        <Figure
          value={String(week.done)}
          unit={week.goal !== null ? `/ ${week.goal}` : undefined}
          className="mt-2 text-4xl"
        />
        <span className="mt-1 text-background/70 text-xs">{weekLine(week)}</span>
        <div className="mt-auto flex flex-col gap-3 pt-4">
          <WeekDays week={week} inverse />
          <span className="text-background/70 text-xs">{weekFoot(week)}</span>
        </div>
      </div>
      {metrics.map((m) => (
        <div key={m.label} className={cn(tile, "min-h-48")}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{m.label}</span>
            {m.diff !== undefined && <Delta diff={m.diff} unit={m.diffUnit} />}
          </div>
          <Figure value={m.value} unit={m.unit} className="mt-2 text-4xl" />
          <span className="mt-1 text-muted-foreground text-xs">4 dernières semaines</span>
          <dl className="mt-auto grid grid-cols-2 gap-3 border-foreground/10 border-t pt-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">4 sem. d'avant</dt>
              <dd className="font-medium text-sm tabular-nums">{m.before}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{m.aside.label}</dt>
              <dd className="font-medium text-sm tabular-nums">{m.aside.value}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── C · Icône ─────────────────────────── */

/** Basses et horizontales : l'icône dans son carré, puis l'intitulé, le chiffre et l'écart. */
function TilesIcon({ week, metrics }: { week: Week; metrics: Metric[] }) {
  const iconBox =
    "flex size-11 shrink-0 items-center justify-center rounded-xl bg-background text-foreground";
  return (
    <div className={grid}>
      <div className={cn(tile, "gap-3 p-4")}>
        <div className="flex items-center gap-3">
          <span className={iconBox}>
            <CalendarCheck className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-muted-foreground text-xs">Cette semaine</span>
            <Figure
              value={String(week.done)}
              unit={week.goal !== null ? `/ ${week.goal}` : undefined}
              className="text-2xl"
            />
          </div>
          {week.goal !== null && (
            <span className="self-start rounded-full bg-background px-2 py-0.5 font-medium text-xs">
              {week.done >= week.goal ? "Atteint" : `Encore ${week.goal - week.done}`}
            </span>
          )}
        </div>
        <WeekDays week={week} size="sm" />
      </div>
      {metrics.map((m) => (
        <div key={m.label} className={cn(tile, "gap-3 p-4")}>
          <div className="flex items-center gap-3">
            <span className={iconBox}>
              <m.icon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-muted-foreground text-xs">{m.label} · 4 sem.</span>
              <Figure value={m.value} unit={m.unit} className="text-2xl" />
            </div>
            {m.diff !== undefined && (
              <Delta diff={m.diff} unit={m.diffUnit} className="self-start" />
            )}
          </div>
          <span className="truncate text-muted-foreground text-xs">{m.foot}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * La rangée de tête (D287) : la semaine face à l'objectif, puis volume, séances et records des
 * quatre dernières semaines, chacun face aux quatre d'avant. Des tuiles sans graphique, en trois
 * mises en forme à comparer.
 */
export function HomeStats({
  sessions,
  variant,
}: {
  sessions: MockSession[];
  variant: "a" | "b" | "c";
}) {
  const data = figures(sessions);
  if (variant === "b") return <TilesCompare {...data} />;
  if (variant === "c") return <TilesIcon {...data} />;
  return <TilesPlain {...data} />;
}

/** L'Accueil pendant le chargement : la rangée de tête, le calendrier, les graphiques. */
export function HomeSkeleton() {
  return (
    <>
      <div className={grid}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
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
