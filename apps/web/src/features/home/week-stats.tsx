import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDelta, formatKg, formatMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { dayEntries, weekDays } from "@/mocks/calendar";
import { mockPlanned } from "@/mocks/planning";
import { useRoutines } from "@/mocks/routine-store";
import { useSessions } from "@/mocks/session-store";
import { weekStreak, weekSummary } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

const WEEKDAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

/**
 * Cette semaine (D270) : les sept jours comme dans le Planning — fait en aplat, prévu en
 * contour, manqué en pointillés —, puis ses chiffres face à la semaine dernière.
 */
export function WeekStats() {
  const sessions = useSessions();
  const routines = useRoutines();
  const routineName = (id: string) => routines.find((r) => r.id === id)?.name ?? "Routine";
  const { current, previous } = weekSummary(sessions, TODAY);
  const streak = weekStreak(sessions, TODAY);
  const figures = [
    {
      label: "Séances",
      value: String(current.count),
      delta: formatDelta(current.count, previous.count),
    },
    {
      label: "Volume",
      value: formatKg(current.volume),
      delta: formatDelta(current.volume, previous.volume, true),
    },
    {
      label: "Durée",
      value: formatMinutes(current.minutes),
      delta: formatDelta(current.minutes, previous.minutes, true),
    },
    {
      label: "Semaines d'affilée",
      value: String(streak),
      delta: streak > 0 ? "en cours" : "à relancer",
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cette semaine</CardTitle>
        <CardDescription>Comparée à la semaine dernière</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/planning">
              Planning <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays(TODAY).map((date, i) => {
            const entries = dayEntries(date, sessions, mockPlanned, TODAY, routineName);
            return (
              <div key={date} className="flex min-w-0 flex-col items-center gap-1.5">
                <span className="text-muted-foreground text-xs uppercase">{WEEKDAYS[i]}</span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-sm tabular-nums",
                    date === TODAY && "bg-foreground font-medium text-background",
                    date < TODAY && "text-muted-foreground",
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                {entries.length === 0 ? (
                  <span className="h-6 text-muted-foreground text-xs">—</span>
                ) : (
                  entries.map((e) => (
                    <span
                      key={e.id}
                      title={{ done: "Faite", planned: "Prévue", missed: "Manquée" }[e.kind]}
                      className={cn(
                        "w-full truncate rounded-md border px-1.5 py-0.5 text-center text-xs",
                        e.kind === "done" && "border-primary bg-primary text-primary-foreground",
                        e.kind === "planned" && "bg-card",
                        e.kind === "missed" && "border-dashed text-muted-foreground line-through",
                      )}
                    >
                      {e.routine}
                    </span>
                  ))
                )}
              </div>
            );
          })}
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs">{f.label}</span>
              <span className="font-semibold text-xl tabular-nums">{f.value}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{f.delta}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
