import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { fr } from "react-day-picker/locale";
import { Page } from "@/components/page";
import { PageTabs } from "@/components/page-tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMonth, formatShortDay, formatWeekdayDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  type DayEntry,
  dayEntries,
  monthGrid,
  type Planned,
  repeatWeek,
  weekDays,
} from "@/mocks/calendar";
import { mockPlanned } from "@/mocks/planning";
import { mockRoutines, routineById } from "@/mocks/routines";
import { mockSessions } from "@/mocks/sessions";
import { addDays, startOfWeek } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

export const PLANNING_TABS = [
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
] as const;
type View = (typeof PLANNING_TABS)[number]["value"];

const routineName = (id: string) => routineById(id)?.name ?? "Routine";
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
};

/** Fait : aplat. Planifiée : contour. Manquée : pointillés, barrée. */
function EntryChip({ entry, compact }: { entry: DayEntry; compact?: boolean }) {
  const className = cn(
    "block truncate rounded-md border px-2 text-left transition-colors",
    compact ? "py-0.5 text-xs" : "py-1.5 text-sm",
    entry.kind === "done" &&
      "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
    entry.kind === "planned" && "bg-background hover:bg-muted",
    entry.kind === "missed" && "border-dashed text-muted-foreground line-through hover:bg-muted",
  );
  if (entry.kind === "done")
    return (
      <Link to="/history/$id" params={{ id: entry.id }} className={className}>
        {entry.routine}
      </Link>
    );
  return (
    <Link
      to="/routines/$id"
      params={{ id: entry.routineId }}
      className={className}
      title={entry.kind === "missed" ? "Manquée" : "Planifiée"}
    >
      {entry.routine}
    </Link>
  );
}

function AddToDay({ date, onAdd }: { date: string; onAdd: (routineId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          aria-label={`Planifier le ${formatShortDay(date)}`}
        >
          <Plus data-icon="inline-start" /> Planifier
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {mockRoutines.map((r) => (
          <button
            key={r.id}
            type="button"
            className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            onClick={() => {
              onAdd(r.id);
              setOpen(false);
            }}
          >
            {r.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function WeekView({
  start,
  planned,
  onAdd,
}: {
  start: string;
  planned: Planned[];
  onAdd: (date: string, routineId: string) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {weekDays(start).map((date) => {
        const entries = dayEntries(date, mockSessions, planned, TODAY, routineName);
        return (
          <Card
            key={date}
            size="sm"
            className={cn("min-h-48", date === TODAY && "ring-2 ring-foreground/20")}
          >
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm first-letter:uppercase",
                  date === TODAY ? "" : "text-muted-foreground",
                )}
              >
                {formatWeekdayDay(date)}
                {date === TODAY && " · aujourd'hui"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-1.5">
              {entries.map((e) => (
                <EntryChip key={e.id} entry={e} />
              ))}
              {entries.length === 0 && date < TODAY && (
                <span className="text-muted-foreground text-xs">Repos</span>
              )}
              {date >= TODAY && (
                <div className="mt-auto">
                  <AddToDay date={date} onAdd={(id) => onAdd(date, id)} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

const WEEKDAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

function MonthView({ month, planned }: { month: string; planned: Planned[] }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="grid grid-cols-7 border-b text-center text-muted-foreground text-xs">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-2">
            {d}
          </span>
        ))}
      </div>
      {monthGrid(month).map((week) => (
        <div key={week[0]} className="grid grid-cols-7 border-b last:border-b-0">
          {week.map((date) => {
            const entries = dayEntries(date, mockSessions, planned, TODAY, routineName);
            const inMonth = date.startsWith(month);
            return (
              <div
                key={date}
                className={cn(
                  "flex min-h-24 flex-col gap-1 border-r p-1.5 last:border-r-0",
                  !inMonth && "bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    !inMonth && "text-muted-foreground",
                    date === TODAY && "bg-foreground text-background",
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                {entries.map((e) => (
                  <EntryChip key={e.id} entry={e} compact />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </Card>
  );
}

/** Variante C : un agenda, des deux semaines passées aux quatre à venir, jours chargés seulement. */
function AgendaView({ planned }: { planned: Planned[] }) {
  const start = addDays(startOfWeek(TODAY), -14);
  const weeks = Array.from({ length: 6 }, (_, w) => addDays(start, w * 7));
  return (
    <div className="flex flex-col gap-6">
      {weeks.map((monday) => {
        const days = weekDays(monday)
          .map((date) => ({
            date,
            entries: dayEntries(date, mockSessions, planned, TODAY, routineName),
          }))
          .filter((d) => d.entries.length > 0 || d.date === TODAY);
        return (
          <section key={monday} className="flex flex-col gap-2">
            <h2 className="font-medium text-sm">
              Semaine du {formatShortDay(monday)}
              {monday === startOfWeek(TODAY) && (
                <span className="text-muted-foreground"> · cette semaine</span>
              )}
            </h2>
            <Card className="gap-0 py-0">
              {days.length === 0 && (
                <p className="px-4 py-3 text-muted-foreground text-sm">Rien de prévu.</p>
              )}
              {days.map((d, i) => (
                <div
                  key={d.date}
                  className={cn(
                    "flex items-center gap-4 px-4 py-2.5",
                    i > 0 && "border-t",
                    d.date === TODAY && "bg-muted/50",
                  )}
                >
                  <span className="w-28 shrink-0 text-muted-foreground text-sm first-letter:uppercase">
                    {formatWeekdayDay(d.date)}
                  </span>
                  <div className="flex flex-1 flex-wrap gap-2">
                    {d.entries.length === 0 ? (
                      <span className="text-muted-foreground text-sm">
                        Aujourd'hui · rien de prévu
                      </span>
                    ) : (
                      d.entries.map((e) => <EntryChip key={e.id} entry={e} />)
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </section>
        );
      })}
    </div>
  );
}

function Legend() {
  const items = [
    { label: "Faite", className: "border-primary bg-primary" },
    { label: "Planifiée", className: "bg-background" },
    { label: "Manquée", className: "border-dashed" },
  ];
  return (
    <div className="flex flex-wrap gap-4 text-muted-foreground text-xs">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={cn("size-3 rounded-sm border", i.className)} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function PlanDialog({
  open,
  onOpenChange,
  onPlan,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPlan: (date: string, routineId: string) => void;
}) {
  const [date, setDate] = useState<Date | undefined>(fromIso(TODAY));
  const [routineId, setRoutineId] = useState(mockRoutines[0]?.id ?? "1");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Planifier une routine</DialogTitle>
          <DialogDescription>Choisissez un jour et la routine à y faire.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Calendar
            mode="single"
            locale={fr}
            weekStartsOn={1}
            selected={date}
            onSelect={setDate}
            disabled={{ before: fromIso(TODAY) }}
            className="mx-auto rounded-lg border"
          />
          <Field>
            <FieldLabel htmlFor="plan-routine">Routine</FieldLabel>
            <Select value={routineId} onValueChange={setRoutineId}>
              <SelectTrigger id="plan-routine" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {mockRoutines.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!date}
            onClick={() => {
              if (date) onPlan(toIso(date), routineId);
              onOpenChange(false);
            }}
          >
            Planifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RepeatDialog({
  open,
  onOpenChange,
  weekStart,
  onRepeat,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  weekStart: string;
  onRepeat: (weeks: number) => void;
}) {
  const [weeks, setWeeks] = useState("4");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Répéter la semaine</DialogTitle>
          <DialogDescription>
            Les routines de la semaine du {formatShortDay(weekStart)} sont recopiées sur les
            semaines suivantes. Ce qui est déjà planifié reste en place.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="repeat-weeks">Pendant</FieldLabel>
          <Select value={weeks} onValueChange={setWeeks}>
            <SelectTrigger id="repeat-weeks" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {["1", "2", "4", "8"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} semaine{n === "1" ? "" : "s"}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              onRepeat(Number(weeks));
              onOpenChange(false);
            }}
          >
            Répéter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Le Planning tient son état en mémoire : pas d'API dans le wireframe. */
export function PlanningView({
  view,
  agenda = false,
  children,
}: {
  view: View;
  /** Variante C : un agenda en liste à la place de la semaine ou du mois. */
  agenda?: boolean;
  children?: React.ReactNode;
}) {
  const [planned, setPlanned] = useState<Planned[]>(mockPlanned);
  const [weekStart, setWeekStart] = useState(startOfWeek(TODAY));
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [planning, setPlanning] = useState(false);
  const [repeating, setRepeating] = useState(false);

  const add = (date: string, routineId: string) =>
    setPlanned((p) => [...p, { id: `p-${date}-${routineId}-${p.length}`, date, routineId }]);

  function shift(step: number) {
    if (view === "semaine") setWeekStart((w) => addDays(w, 7 * step));
    else {
      const [y, m] = month.split("-").map(Number);
      const d = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1 + step, 1));
      setMonth(d.toISOString().slice(0, 7));
    }
  }

  const label =
    view === "semaine"
      ? `Semaine du ${formatShortDay(weekStart)} au ${formatShortDay(addDays(weekStart, 6))}`
      : formatMonth(month);

  return (
    <Page
      title="Planning"
      tabs={<PageTabs tabs={PLANNING_TABS} />}
      actions={
        <>
          <Button variant="outline" onClick={() => setRepeating(true)}>
            Répéter la semaine
          </Button>
          <Button onClick={() => setPlanning(true)}>Planifier</Button>
        </>
      }
    >
      {children ?? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {!agenda && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Précédent"
                  onClick={() => shift(-1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setWeekStart(startOfWeek(TODAY));
                    setMonth(TODAY.slice(0, 7));
                  }}
                >
                  Aujourd'hui
                </Button>
                <Button variant="outline" size="icon" aria-label="Suivant" onClick={() => shift(1)}>
                  <ChevronRight />
                </Button>
                <span className="ml-2 font-medium first-letter:uppercase">{label}</span>
              </div>
            )}
            <Legend />
          </div>
          {agenda ? (
            <AgendaView planned={planned} />
          ) : view === "semaine" ? (
            <WeekView start={weekStart} planned={planned} onAdd={add} />
          ) : (
            <MonthView month={month} planned={planned} />
          )}
        </>
      )}
      <PlanDialog open={planning} onOpenChange={setPlanning} onPlan={add} />
      <RepeatDialog
        open={repeating}
        onOpenChange={setRepeating}
        weekStart={weekStart}
        onRepeat={(n) => setPlanned((p) => repeatWeek(p, weekStart, n))}
      />
    </Page>
  );
}
