import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, ChevronRight, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listLinkProps, selectedRowClass } from "@/components/list-detail";
import { type RowAction, RowMenu } from "@/components/row-menu";
import { formatDaysAgo, formatMinutes, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import { daysSince, estimateMinutes } from "@/mocks/routine-stats";
import { deleteRoutine, newRoutineId, saveRoutine, useDraftName } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { TODAY } from "@/mocks/today";

/** Les muscles d'une routine, sans doublon, dans l'ordre des exercices. */
function routineMuscles(routine: MockRoutine): string[] {
  const muscles = routine.exercises.map((e) => exerciseBySlug(e.slug)?.muscle ?? "");
  return [...new Set(muscles.filter(Boolean))];
}

const rowClass = cn(
  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
  selectedRowClass,
);

/** Le clic droit sur une routine : les mêmes actions que son menu ⋯. */
function routineActions(
  routine: MockRoutine,
  navigate: ReturnType<typeof useNavigate>,
): RowAction[] {
  return [
    { label: "Planifier", icon: CalendarPlus, onSelect: () => navigate({ to: "/planning" }) },
    {
      label: "Dupliquer",
      icon: Copy,
      onSelect: () => {
        const copy = {
          ...routine,
          id: newRoutineId(),
          name: `${routine.name} (copie)`,
          lastDone: null,
        };
        saveRoutine(copy);
        navigate({ to: "/routines/$id", params: { id: copy.id }, search: true });
        toast.success(`« ${copy.name} » créée`);
      },
    },
    {
      label: "Supprimer",
      icon: Trash2,
      destructive: true,
      separated: true,
      onSelect: () => {
        deleteRoutine(routine.id);
        toast(`« ${routine.name} » supprimée`, {
          action: { label: "Annuler", onClick: () => saveRoutine(routine) },
        });
      },
    },
  ];
}

/**
 * Une routine dans la liste, en ligne compacte comme Exercices et Historique (D251) : le nom et
 * ses muscles, la durée estimée et la dernière fois. Le reste se lit dans le détail.
 */
export function RoutineRow({ routine }: { routine: MockRoutine }) {
  const navigate = useNavigate();
  return (
    <RowMenu actions={routineActions(routine, navigate)}>
      <Link to="/routines/$id" params={{ id: routine.id }} {...listLinkProps} className={rowClass}>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{routine.name}</span>
          <span className="truncate text-muted-foreground text-xs">
            {[plural(routine.exercises.length, "exercice"), ...routineMuscles(routine)].join(" · ")}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-sm tabular-nums">
            ~{formatMinutes(estimateMinutes(routine.exercises))}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatDaysAgo(routine.lastDone ? daysSince(routine.lastDone, TODAY) : null)}
          </span>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </RowMenu>
  );
}

/** La ligne de la routine en cours de création, en tête de liste (D238) : elle suit le nom tapé. */
export function DraftRoutineRow() {
  const name = useDraftName();
  return (
    <Link to="/routines/new" {...listLinkProps} className={cn(rowClass, "border-b border-dashed")}>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={name.trim() ? "truncate font-medium" : "text-muted-foreground"}>
          {name.trim() || "Sans nom"}
        </span>
        <span className="text-muted-foreground text-xs">Brouillon · pas encore enregistrée</span>
      </div>
    </Link>
  );
}
