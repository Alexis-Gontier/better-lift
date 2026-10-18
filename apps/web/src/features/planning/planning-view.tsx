import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  MoreHorizontal,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { fr } from "react-day-picker/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatMinutes, formatMonth, formatShortDay, formatWeekdayDay, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  busyDays,
  type DayEntry,
  dayEntries,
  monthGrid,
  movePlanned,
  type Planned,
  repeatWeek,
  weekDays,
} from "@/mocks/calendar";
import { mockPlanned } from "@/mocks/planning";
import { estimateMinutes } from "@/mocks/routine-stats";
import { useRoutines } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { useSessions } from "@/mocks/session-store";
import type { MockSession } from "@/mocks/sessions";
import { addDays, startOfWeek } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

type View = "semaine" | "mois";

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
};
const WEEKDAYS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

/** Ce que le glisser transporte : une routine de la liste (copie) ou une séance prévue (déplacement). */
const DRAG_ROUTINE = "application/x-routine-id";
const DRAG_PLANNED = "application/x-planned-id";

type Ctx = {
  routines: MockRoutine[];
  sessions: MockSession[];
  planned: Planned[];
  add: (date: string, routineId: string) => void;
  move: (id: string, date: string) => void;
  remove: (id: string) => void;
};

/** Fait : aplat. Prévue : contour. Manquée : pointillés, barrée (D269, comme D234). */
const toneOf = (kind: DayEntry["kind"]) =>
  cn(
    kind === "done" && "border-primary bg-primary text-primary-foreground",
    kind === "planned" && "bg-card hover:bg-muted",
    kind === "missed" && "border-dashed text-muted-foreground line-through hover:bg-muted",
  );

/**
 * Une séance dans le calendrier, comme un évènement de Google Agenda (D269) : son nom, sa durée
 * et ses exercices ; un clic ouvre une petite fenêtre pour la voir, la déplacer ou la retirer.
 * Une séance prévue se glisse d'un jour à l'autre.
 */
function EventBlock({ entry, ctx, compact }: { entry: DayEntry; ctx: Ctx; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const routine =
    entry.kind === "done"
      ? ctx.routines.find((r) => r.name === entry.routine)
      : ctx.routines.find((r) => r.id === entry.routineId);
  const session = entry.kind === "done" ? ctx.sessions.find((s) => s.id === entry.id) : undefined;
  const minutes = session?.minutes ?? (routine ? estimateMinutes(routine.exercises) : 0);
  const date = session?.date ?? ctx.planned.find((p) => p.id === entry.id)?.date ?? TODAY;
  const status = { done: "Faite", planned: "Prévue", missed: "Manquée" }[entry.kind];
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setMoving(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          draggable={entry.kind !== "done"}
          onDragStart={(e) => {
            e.dataTransfer.setData(DRAG_PLANNED, entry.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          className={cn(
            "flex w-full min-w-0 flex-col rounded-md border text-left transition-colors",
            compact ? "px-1.5 py-0.5" : "gap-0.5 px-2 py-1.5",
            entry.kind !== "done" && "cursor-grab active:cursor-grabbing",
            toneOf(entry.kind),
          )}
        >
          <span className={cn("truncate font-medium", compact ? "text-xs" : "text-sm")}>
            {entry.routine}
          </span>
          {!compact && (
            <span
              className={cn(
                "truncate text-xs",
                entry.kind === "done" ? "opacity-80" : "text-muted-foreground",
              )}
            >
              {entry.kind === "done" ? "" : "~"}
              {formatMinutes(minutes)}
              {routine ? ` · ${plural(routine.exercises.length, "exercice")}` : ""}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="flex flex-col gap-1 p-3">
          <span className="font-medium">{entry.routine}</span>
          <span className="text-muted-foreground text-sm first-letter:uppercase">
            {formatWeekdayDay(date)} · {status}
          </span>
          <span className="text-muted-foreground text-sm">
            {entry.kind === "done" ? "" : "~"}
            {formatMinutes(minutes)}
            {routine ? ` · ${plural(routine.exercises.length, "exercice")}` : ""}
          </span>
        </div>
        <Separator />
        {moving ? (
          <Calendar
            mode="single"
            locale={fr}
            weekStartsOn={1}
            today={fromIso(TODAY)}
            selected={fromIso(date)}
            disabled={{ before: fromIso(TODAY) }}
            onSelect={(d) => {
              if (!d) return;
              ctx.move(entry.id, toIso(d));
              setOpen(false);
              toast(`${entry.routine} déplacée au ${formatShortDay(toIso(d))}`);
            }}
            className="mx-auto"
          />
        ) : (
          <div className="flex flex-col p-1">
            {entry.kind === "done" ? (
              <Button variant="ghost" size="sm" className="justify-start" asChild>
                <Link to="/history/$id" params={{ id: entry.id }}>
                  <ListChecks data-icon="inline-start" /> Voir la séance
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="justify-start" asChild>
                  <Link to="/routines/$id" params={{ id: entry.routineId }}>
                    <ListChecks data-icon="inline-start" /> Voir la routine
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => setMoving(true)}
                >
                  <CalendarClock data-icon="inline-start" />
                  {entry.kind === "missed" ? "Replanifier" : "Déplacer"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-destructive hover:text-destructive"
                  onClick={() => {
                    ctx.remove(entry.id);
                    setOpen(false);
                  }}
                >
                  <Trash2 data-icon="inline-start" /> Retirer du planning
                </Button>
              </>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** « + » sur un jour à venir : choisir une routine à y poser, au clavier comme à la souris. */
function AddToDay({ date, ctx }: { date: string; ctx: Ctx }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover/day:opacity-100"
          aria-label={`Planifier le ${formatShortDay(date)}`}
        >
          <Plus data-icon="inline-start" /> Planifier
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {ctx.routines.map((r) => (
          <button
            key={r.id}
            type="button"
            className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            onClick={() => {
              ctx.add(date, r.id);
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

/** Un jour qui reçoit une routine glissée (copie) ou une séance prévue (déplacement). */
function useDrop(date: string, ctx: Ctx) {
  const [over, setOver] = useState(false);
  const droppable = date >= TODAY;
  return {
    over,
    props: {
      onDragOver: (e: React.DragEvent) => {
        const types = e.dataTransfer.types;
        if (!droppable || !(types.includes(DRAG_ROUTINE) || types.includes(DRAG_PLANNED))) return;
        e.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (e: React.DragEvent) => {
        setOver(false);
        if (!droppable) return;
        const routine = e.dataTransfer.getData(DRAG_ROUTINE);
        const planned = e.dataTransfer.getData(DRAG_PLANNED);
        if (routine) ctx.add(date, routine);
        else if (planned) ctx.move(planned, date);
      },
    },
  };
}

function WeekColumn({ date, ctx }: { date: string; ctx: Ctx }) {
  const drop = useDrop(date, ctx);
  const routineName = (id: string) => ctx.routines.find((r) => r.id === id)?.name ?? "Routine";
  const entries = dayEntries(date, ctx.sessions, ctx.planned, TODAY, routineName);
  return (
    <div
      {...drop.props}
      className={cn(
        "group/day flex min-h-0 flex-col gap-1.5 border-r p-1.5 last:border-r-0",
        date < TODAY && "bg-muted/20",
        drop.over && "bg-muted ring-2 ring-foreground/30 ring-inset",
      )}
    >
      {entries.map((e) => (
        <EventBlock key={e.id} entry={e} ctx={ctx} />
      ))}
      {date >= TODAY && <AddToDay date={date} ctx={ctx} />}
    </div>
  );
}

/** La semaine, sept colonnes pleine hauteur ; le jour en tête, aujourd'hui en pastille. */
function WeekView({ start, ctx }: { start: string; ctx: Ctx }) {
  const days = weekDays(start);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
      <div className="grid grid-cols-7 border-b">
        {days.map((date) => (
          <div
            key={date}
            className="flex flex-col items-center gap-0.5 border-r py-2 last:border-r-0"
          >
            <span className="text-muted-foreground text-xs uppercase">
              {WEEKDAYS[days.indexOf(date)]}
            </span>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full font-medium text-lg tabular-nums",
                date === TODAY && "bg-foreground text-background",
                date < TODAY && "text-muted-foreground",
              )}
            >
              {Number(date.slice(8))}
            </span>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7">
        {days.map((date) => (
          <WeekColumn key={date} date={date} ctx={ctx} />
        ))}
      </div>
    </div>
  );
}

function MonthCell({ date, month, ctx }: { date: string; month: string; ctx: Ctx }) {
  const drop = useDrop(date, ctx);
  const routineName = (id: string) => ctx.routines.find((r) => r.id === id)?.name ?? "Routine";
  const entries = dayEntries(date, ctx.sessions, ctx.planned, TODAY, routineName);
  const inMonth = date.startsWith(month);
  return (
    <div
      {...drop.props}
      className={cn(
        "flex min-h-0 flex-col gap-1 overflow-hidden border-r p-1.5 last:border-r-0",
        !inMonth && "bg-muted/30",
        drop.over && "bg-muted ring-2 ring-foreground/30 ring-inset",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center self-center rounded-full text-xs tabular-nums",
          !inMonth && "text-muted-foreground",
          date === TODAY && "bg-foreground text-background",
        )}
      >
        {Number(date.slice(8))}
      </span>
      {entries.map((e) => (
        <EventBlock key={e.id} entry={e} ctx={ctx} compact />
      ))}
    </div>
  );
}

/** Le mois en grille, comme Google Agenda : les mêmes blocs, compacts, et la même fenêtre. */
function MonthView({ month, ctx }: { month: string; ctx: Ctx }) {
  const weeks = monthGrid(month);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
      <div className="grid grid-cols-7 border-b text-center text-muted-foreground text-xs uppercase">
        {WEEKDAYS.map((d) => (
          <span key={d} className="border-r py-2 last:border-r-0">
            {d}
          </span>
        ))}
      </div>
      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(5.5rem, 1fr))` }}
      >
        {weeks.map((week) => (
          <div key={week[0]} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((date) => (
              <MonthCell key={date} date={date} month={month} ctx={ctx} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * La colonne de gauche (D269) : Planifier, le mini-calendrier pour sauter à une date — un point
 * sous les jours chargés —, puis les routines à glisser sur un jour.
 */
function Sidebar({
  ctx,
  focus,
  onFocus,
  onPlan,
}: {
  ctx: Ctx;
  focus: string;
  onFocus: (date: string) => void;
  onPlan: () => void;
}) {
  const busy = busyDays(ctx.planned, ctx.sessions);
  return (
    // Sous 1280 px, la colonne cède sa place au calendrier ; Planifier passe dans la barre.
    <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r xl:flex">
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
        <div className="flex flex-col gap-4 p-4">
          <Button className="w-full" onClick={onPlan}>
            <Plus data-icon="inline-start" /> Planifier
          </Button>
          <Calendar
            mode="single"
            locale={fr}
            weekStartsOn={1}
            today={fromIso(TODAY)}
            selected={fromIso(focus)}
            month={fromIso(focus)}
            onMonthChange={(d) => onFocus(toIso(d))}
            onSelect={(d) => d && onFocus(toIso(d))}
            modifiers={{ busy: (d) => busy.has(toIso(d)) }}
            modifiersClassNames={{
              busy: "relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-foreground/60",
            }}
            className="mx-auto p-0"
          />
          <Separator />
          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-sm">Routines</span>
            {ctx.routines.map((r) => (
              // Un bouton glissable ; au clavier, « + Planifier » sur chaque jour fait la même chose.
              <button
                type="button"
                key={r.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(DRAG_ROUTINE, r.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="flex cursor-grab items-center justify-between gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted active:cursor-grabbing"
              >
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 text-muted-foreground text-xs">
                  ~{formatMinutes(estimateMinutes(r.exercises))}
                </span>
              </button>
            ))}
            <p className="pt-1 text-muted-foreground text-xs">
              Glissez une routine sur un jour à venir ; glissez une séance prévue pour la déplacer.
            </p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

function Legend() {
  const items = [
    { label: "Faite", className: "border-primary bg-primary" },
    { label: "Prévue", className: "bg-card" },
    { label: "Manquée", className: "border-dashed" },
  ];
  return (
    <div className="hidden flex-wrap gap-3 text-muted-foreground text-xs @3xl:flex">
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
  routines,
  onPlan,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  routines: MockRoutine[];
  onPlan: (date: string, routineId: string) => void;
}) {
  const [date, setDate] = useState<Date | undefined>(fromIso(TODAY));
  const [routineId, setRoutineId] = useState(routines[0]?.id ?? "1");
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
            today={fromIso(TODAY)}
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
                  {routines.map((r) => (
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

/** Le mois d'une date `YYYY-MM-DD`, décalé de `step` mois. */
function shiftMonth(date: string, step: number): string {
  const [y, m] = date.split("-").map(Number);
  const d = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1 + step, 1));
  return d.toISOString().slice(0, 10);
}

/** « 12 – 18 oct. 2026 » pour une semaine, « Octobre 2026 » pour un mois. */
function titleOf(view: View, focus: string): string {
  if (view === "mois") return formatMonth(focus.slice(0, 7));
  const start = startOfWeek(focus);
  return `${formatShortDay(start)} – ${formatShortDay(addDays(start, 6))} ${start.slice(0, 4)}`;
}

/**
 * Le Planning, à la façon de Google Agenda (D269) : la colonne de gauche (Planifier,
 * mini-calendrier, routines à glisser), une barre d'outils (Aujourd'hui, ‹ ›, le titre, Semaine
 * ou Mois), puis le calendrier sur toute la hauteur. Le wireframe tient le planning en mémoire.
 */
export function PlanningView({ children }: { children?: React.ReactNode }) {
  const routines = useRoutines();
  const sessions = useSessions();
  const [planned, setPlanned] = useState<Planned[]>(mockPlanned);
  const [view, setView] = useState<View>("semaine");
  const [focus, setFocus] = useState(TODAY);
  const [planning, setPlanning] = useState(false);
  const [repeating, setRepeating] = useState(false);

  const ctx: Ctx = {
    routines,
    sessions,
    planned,
    add: (date, routineId) =>
      setPlanned((p) => [...p, { id: `p-${date}-${routineId}-${p.length}`, date, routineId }]),
    move: (id, date) => setPlanned((p) => movePlanned(p, id, date)),
    remove: (id) => {
      const before = planned;
      setPlanned((p) => p.filter((x) => x.id !== id));
      toast("Séance retirée du planning", {
        action: { label: "Annuler", onClick: () => setPlanned(before) },
      });
    },
  };
  const step = (n: number) =>
    setFocus((f) => (view === "semaine" ? addDays(f, 7 * n) : shiftMonth(f, n)));

  return (
    <div className="flex h-[calc(100svh-3rem)]">
      <h1 className="sr-only">Planning</h1>
      <Sidebar ctx={ctx} focus={focus} onFocus={setFocus} onPlan={() => setPlanning(true)} />
      <div className="@container flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="xl:hidden" onClick={() => setPlanning(true)}>
            <Plus data-icon="inline-start" /> Planifier
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFocus(TODAY)}>
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Précédent" onClick={() => step(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Suivant" onClick={() => step(1)}>
            <ChevronRight />
          </Button>
          <h2 className="ml-1 font-medium text-xl first-letter:uppercase">
            {titleOf(view, focus)}
          </h2>
          <div className="ml-auto flex items-center gap-3">
            <Legend />
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              aria-label="Vue"
              value={view}
              onValueChange={(v) => v && setView(v as View)}
            >
              <ToggleGroupItem value="semaine">Semaine</ToggleGroupItem>
              <ToggleGroupItem value="mois">Mois</ToggleGroupItem>
            </ToggleGroup>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="Plus d'actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => setRepeating(true)}>
                  <Repeat /> Répéter cette semaine
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {children ??
          (view === "semaine" ? (
            <WeekView start={startOfWeek(focus)} ctx={ctx} />
          ) : (
            <MonthView month={focus.slice(0, 7)} ctx={ctx} />
          ))}
      </div>
      <PlanDialog open={planning} onOpenChange={setPlanning} routines={routines} onPlan={ctx.add} />
      <RepeatDialog
        open={repeating}
        onOpenChange={setRepeating}
        weekStart={startOfWeek(focus)}
        onRepeat={(n) => setPlanned((p) => repeatWeek(p, startOfWeek(focus), n))}
      />
    </div>
  );
}

/** Le calendrier pendant le chargement : l'en-tête des jours, puis sept colonnes. */
export function PlanningSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Skeleton className="h-14 rounded-xl" />
      <div className="grid min-h-0 flex-1 grid-cols-7 gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
