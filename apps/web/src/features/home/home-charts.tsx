import { Link } from "@tanstack/react-router";
import { ArrowRight, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
} from "@/components/kibo-ui/contribution-graph";
import { listLinkProps } from "@/components/list-detail";
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
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  formatDay,
  formatKg,
  formatMinutes,
  formatNumber,
  formatShortDay,
  formatWeekdayDay,
  plural,
} from "@/lib/format";
import { dailyActivity, sessionsByRoutine, weeklyTotals } from "@/mocks/dashboard";
import type { MockSession } from "@/mocks/sessions";
import { addDays } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/**
 * L'assiduité sur un an, façon GitHub (D287) : une case par jour, lundi en haut, plus foncée
 * quand le volume du jour est haut. Le survol dit la date et ce qui a été fait.
 */
export function ActivityCalendar({ sessions }: { sessions: MockSession[] }) {
  const days = dailyActivity(sessions, TODAY, 53);
  const total = days.reduce((n, d) => n + d.count, 0);
  const active = days.filter((d) => d.count > 0).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assiduité</CardTitle>
        <CardDescription>Les 12 derniers mois, une case par jour</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Le calendrier garde ses cases à taille fixe : sur un écran étroit, il défile, calé sur
            les semaines récentes. */}
        <div
          ref={(el) => {
            const scroller = el?.querySelector<HTMLElement>("[data-defile]");
            if (scroller) scroller.scrollLeft = scroller.scrollWidth;
          }}
        >
          <ContributionGraph
            data={days}
            weekStart={1}
            blockSize={13}
            blockMargin={3}
            fontSize={12}
            labels={{ months: MONTHS, legend: { less: "Moins", more: "Plus" } }}
            className="mx-auto"
          >
            <ContributionGraphCalendar data-defile>
              {({ activity, dayIndex, weekIndex }) => (
                <ContributionGraphBlock
                  activity={activity}
                  dayIndex={dayIndex}
                  weekIndex={weekIndex}
                >
                  <title>
                    {activity.count > 0
                      ? `${formatDay(activity.date)} · ${plural(activity.count, "séance")}`
                      : formatDay(activity.date)}
                  </title>
                </ContributionGraphBlock>
              )}
            </ContributionGraphCalendar>
            <ContributionGraphFooter>
              <ContributionGraphTotalCount>
                {() => (
                  <span className="text-muted-foreground">
                    {plural(total, "séance")} sur {plural(active, "jour")} d'entraînement
                  </span>
                )}
              </ContributionGraphTotalCount>
              <ContributionGraphLegend />
            </ContributionGraphFooter>
          </ContributionGraph>
        </div>
      </CardContent>
    </Card>
  );
}

const volumeConfig = {
  volume: { label: "Volume", color: "var(--chart-2)" },
} satisfies ChartConfig;
const WEEKS = 16;

/** Le volume soulevé chaque semaine, sur les seize dernières, la semaine en cours comprise. */
export function VolumeChart({ sessions }: { sessions: MockSession[] }) {
  const weeks = weeklyTotals(sessions, TODAY, WEEKS);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume par semaine</CardTitle>
        <CardDescription>Les {WEEKS} dernières semaines, celle-ci comprise</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={volumeConfig} className="aspect-auto h-64 w-full">
          <BarChart data={weeks} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="start"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShortDay}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(kg: number) => `${formatNumber(kg / 1000)} t`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const start = payload[0]?.payload.start as string | undefined;
                    return start ? `Semaine du ${formatShortDay(start)}` : "";
                  }}
                  formatter={(v, _name, item) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">
                        {plural(item.payload.count as number, "séance")}
                      </span>
                      <span className="tabular-nums">{formatKg(Number(v))}</span>
                    </span>
                  )}
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

const routineConfig = {
  count: { label: "Séances", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Ce que les trois derniers mois ont fait de chaque routine. */
export function RoutineChart({ sessions }: { sessions: MockSession[] }) {
  const data = sessionsByRoutine(sessions, addDays(TODAY, -90));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Séances par routine</CardTitle>
        <CardDescription>Les 3 derniers mois</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={routineConfig} className="aspect-auto h-64 w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24 }}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="routine" tickLine={false} axisLine={false} width={80} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={4}
              isAnimationActive={false}
              label={{ position: "right", className: "fill-foreground text-xs tabular-nums" }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/** Les cinq dernières séances, chacune ouvre son détail dans l'Historique. */
export function RecentSessions({ sessions }: { sessions: MockSession[] }) {
  return (
    <Card className="@4xl:col-span-2">
      <CardHeader>
        <CardTitle>Dernières séances</CardTitle>
        <CardDescription>Faites sur le téléphone, relues ici</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/history">
              Historique <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col">
        {sessions.slice(0, 5).map((s) => (
          <Link
            key={s.id}
            to="/history/$id"
            params={{ id: s.id }}
            {...listLinkProps}
            className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{s.routine}</span>
              <span className="text-muted-foreground text-xs first-letter:uppercase">
                {formatWeekdayDay(s.date)} · {formatMinutes(s.minutes)}
              </span>
            </span>
            {s.records > 0 && (
              <Badge variant="outline">
                <Trophy data-icon="inline-start" />
                {s.records}
              </Badge>
            )}
            <span className="w-24 text-right text-sm tabular-nums">{formatKg(s.volume)}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
