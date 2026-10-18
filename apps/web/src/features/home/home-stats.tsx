import { Link } from "@tanstack/react-router";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { weeklyGoal } from "@/features/settings/training-settings";
import { formatMinutes, formatNumber, formatShortDay, plural } from "@/lib/format";
import { comparedPeriods, goalStreak, weeklyTotals } from "@/mocks/dashboard";
import type { MockSession } from "@/mocks/sessions";
import { TODAY } from "@/mocks/today";

/** La période des cartes, comparée à la même juste avant. */
const DAYS = 28;

/** « 128,4 t » : le volume d'une période se lit en tonnes. */
const tons = (kg: number) => `${formatNumber(Math.round(kg / 100) / 10)} t`;

/** L'écart à la période d'avant : flèche et signe ; « ±0 » quand rien ne bouge. */
function Delta({ diff, unit = "" }: { diff: number; unit?: string }) {
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
  return (
    <Badge variant="outline" className="tabular-nums">
      <Icon data-icon="inline-start" />
      {sign}
      {formatNumber(Math.abs(diff))}
      {unit}
    </Badge>
  );
}

/** Une carte chiffrée : l'intitulé, le chiffre, son écart, et deux lignes qui l'expliquent. */
function StatCard({
  label,
  value,
  delta,
  children,
  hint,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  /** La ligne forte du pied. */
  children: ReactNode;
  /** La ligne discrète du pied. */
  hint: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-semibold text-3xl tabular-nums">{value}</CardTitle>
        {delta && <CardAction>{delta}</CardAction>}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="font-medium">{children}</div>
        <div className="text-muted-foreground">{hint}</div>
      </CardFooter>
    </Card>
  );
}

/** La semaine en cours face à l'objectif des Paramètres, et la série de semaines tenues. */
function WeekCard({ sessions }: { sessions: MockSession[] }) {
  const goal = weeklyGoal();
  const weeks = weeklyTotals(sessions, TODAY, 52);
  const done = weeks.at(-1)?.count ?? 0;
  if (goal === null)
    return (
      <StatCard
        label="Cette semaine"
        value={plural(done, "séance")}
        hint={
          <Link to="/settings/training" className="underline-offset-4 hover:underline">
            Fixer un objectif
          </Link>
        }
      >
        Pas d'objectif par semaine
      </StatCard>
    );
  const left = goal - done;
  const streak = goalStreak(weeks, goal);
  return (
    <Card>
      <CardHeader>
        <CardDescription>Cette semaine</CardDescription>
        <CardTitle className="font-semibold text-3xl tabular-nums">
          {done}
          <span className="font-normal text-muted-foreground text-xl"> / {goal}</span>
        </CardTitle>
        {left <= 0 && (
          <CardAction>
            <Badge variant="outline">Atteint</Badge>
          </CardAction>
        )}
      </CardHeader>
      <div className="px-(--card-spacing)">
        <Progress value={Math.min(100, (done / goal) * 100)} aria-label="Objectif de la semaine" />
      </div>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="font-medium">
          {left <= 0
            ? "Objectif de la semaine atteint"
            : `${plural(left, "séance")} pour l'objectif`}
        </div>
        <div className="text-muted-foreground">
          {streak > 0
            ? `${plural(streak, "semaine")} d'affilée à l'objectif`
            : "Aucune semaine d'affilée à l'objectif"}
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * La rangée de tête (D287) : la semaine face à l'objectif, puis volume, séances et records des
 * quatre dernières semaines, chacun face aux quatre d'avant.
 */
export function HomeStats({ sessions }: { sessions: MockSession[] }) {
  const { now, before } = comparedPeriods(sessions, TODAY, DAYS);
  const volumeDiff =
    before.volume > 0 ? Math.round(((now.volume - before.volume) / before.volume) * 100) : 0;
  const lastRecord = sessions.find((s) => s.records > 0);
  return (
    <div className="grid gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
      <WeekCard sessions={sessions} />
      <StatCard
        label="Volume · 4 semaines"
        value={tons(now.volume)}
        delta={before.volume > 0 && <Delta diff={volumeDiff} unit=" %" />}
        hint={`${tons(before.volume)} les 4 semaines d'avant`}
      >
        {`${tons(now.volume / 4)} par semaine`}
      </StatCard>
      <StatCard
        label="Séances · 4 semaines"
        value={now.count}
        delta={<Delta diff={now.count - before.count} />}
        hint={
          now.count > 0
            ? `${formatMinutes(Math.round(now.minutes / now.count))} en moyenne`
            : "Aucune séance"
        }
      >
        {`${formatNumber(now.count / 4)} par semaine`}
      </StatCard>
      <StatCard
        label="Records · 4 semaines"
        value={now.records}
        delta={<Delta diff={now.records - before.records} />}
        hint={
          lastRecord ? (
            <Link
              to="/history/$id"
              params={{ id: lastRecord.id }}
              className="underline-offset-4 hover:underline"
            >
              Dernier : {lastRecord.routine}, {formatShortDay(lastRecord.date)}
            </Link>
          ) : (
            "Pas encore de record"
          )
        }
      >
        {`${plural(before.records, "record")} les 4 semaines d'avant`}
      </StatCard>
    </div>
  );
}

/** L'Accueil pendant le chargement : la rangée de cartes, le calendrier, les graphiques. */
export function HomeSkeleton() {
  return (
    <>
      <div className="grid gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
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
