import { useDraggable } from "@dnd-kit/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { CalendarPlus, ChevronRight, Copy, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listCardClass, listLinkProps } from "@/components/list-detail";
import { type RowAction, RowMenu } from "@/components/row-menu";
import { Card } from "@/components/ui/card";
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

const rowClass = "flex items-center gap-3 px-4 py-3";

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

/** Le contenu d'une ligne de routine : nom et muscles, durée et dernière fois. */
function RowBody({ routine }: { routine: MockRoutine }) {
  return (
    <>
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
    </>
  );
}

/**
 * Une routine dans la liste, en ligne compacte (D251) ; sa poignée la glisse dans un autre
 * dossier (D257).
 */
export function RoutineRow({ routine }: { routine: MockRoutine }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: routine.id,
    data: { routine },
  });
  return (
    <Card ref={setNodeRef} className={cn(listCardClass, isDragging && "opacity-40")}>
      {/* Un vrai bouton : sans focus possible, la poignée ne répondrait pas au clavier. */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Changer de dossier : ${routine.name}`}
        className="flex w-7 shrink-0 cursor-grab items-center justify-center text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <RowMenu actions={routineActions(routine, navigate)}>
        <Link
          to="/routines/$id"
          params={{ id: routine.id }}
          {...listLinkProps}
          className={cn(rowClass, "min-w-0 flex-1 pl-1")}
        >
          <RowBody routine={routine} />
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </RowMenu>
    </Card>
  );
}

/** La ligne qui suit le pointeur pendant un glisser. */
export function RoutineRowPreview({ routine }: { routine: MockRoutine }) {
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg">
      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      <RowBody routine={routine} />
    </div>
  );
}

/** La ligne de la routine en cours de création, en tête de liste (D238) : elle suit le nom tapé. */
export function DraftRoutineRow() {
  const name = useDraftName();
  return (
    <Link
      to="/routines/new"
      {...listLinkProps}
      className={cn(rowClass, "rounded-xl border border-dashed data-[status=active]:bg-muted/40")}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={name.trim() ? "truncate font-medium" : "text-muted-foreground"}>
          {name.trim() || "Sans nom"}
        </span>
        <span className="text-muted-foreground text-xs">Brouillon · pas encore enregistrée</span>
      </div>
    </Link>
  );
}
