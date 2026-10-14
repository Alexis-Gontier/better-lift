import type { RoutineResume } from "@better-lift/shared";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "cn";
import { GripVertical, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  /** Les routines affichées, déjà filtrées. */
  routines: RoutineResume[];
  total: number;
  filter: string;
  onFilter: (text: string) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onReorder: (ids: string[]) => void;
};

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

/**
 * La colonne des routines (D142, D160) : le filtre et l'action en tête, puis une ligne par
 * routine, réordonnable par la poignée (souris ou clavier) — sauf filtrée : on ne réordonne
 * pas une liste partielle. La ligne choisie est une SURFACE, jamais l'orange.
 */
export function RoutineList({
  routines,
  total,
  filter,
  onFilter,
  selectedId,
  onSelect,
  onCreate,
  onReorder,
}: Props) {
  const sensors = useSensors(
    // 4 px avant de démarrer : sans ce seuil, un clic sur la poignée serait un glisser.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const drop = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = routines.map((r) => r.id);
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  return (
    <section aria-label="Routines" className="flex h-full flex-col">
      {/* Le titre est dans l'en-tête commun (D157) ; ici, le filtre et l'action (D160). */}
      <header className="flex flex-col gap-2 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={filter}
              onChange={(e) => onFilter(e.target.value)}
              placeholder="Filtrer…"
              aria-label="Filtrer les routines"
              className="h-8 pl-8"
            />
          </div>
          <Badge variant="outline" title={plural(total, "routine")}>
            {total}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={onCreate} className="w-full font-semibold">
          <Plus aria-hidden="true" />
          Nouvelle routine
        </Button>
      </header>

      {routines.length === 0 && filter.trim() ? (
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">
          Aucune routine ne correspond à ce filtre.
        </p>
      ) : routines.length === 0 ? (
        // Un compte neuf n'a aucune routine : c'est le tout premier écran qu'on verra.
        <p className="px-5 py-6 text-center text-sm text-muted-foreground">
          Aucune routine pour l'instant. Une routine est un modèle de séance : ses exercices et
          leurs séries cibles.
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={drop}>
            <SortableContext
              items={routines.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col">
                {routines.map((r) => (
                  <RoutineCard
                    key={r.id}
                    routine={r}
                    selected={r.id === selectedId}
                    sortable={!filter.trim()}
                    onClick={() => onSelect(r.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      )}
    </section>
  );
}

function RoutineCard({
  routine: r,
  selected,
  sortable,
  onClick,
}: {
  routine: RoutineResume;
  selected: boolean;
  sortable: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: r.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center border-b",
        selected
          ? "bg-muted shadow-[inset_2px_0_0_var(--foreground)]"
          : "hover:bg-secondary-background",
        isDragging && "relative z-10 bg-muted shadow-lg",
      )}
    >
      {sortable ? (
        <button
          type="button"
          aria-label={`Déplacer « ${r.nom} »`}
          className="cursor-grab touch-none self-stretch pl-1.5 text-muted-foreground opacity-0 outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      ) : (
        <span className="w-[22px] shrink-0" />
      )}
      <button
        type="button"
        onClick={onClick}
        aria-current={selected ? "true" : undefined}
        className="min-w-0 flex-1 px-2 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="block truncate font-bold">{r.nom}</span>
        <span className="mt-0.5 block text-[12.5px] text-foreground">
          {plural(r.nbExercices, "exercice")} · {plural(r.nbSeries, "série")}
        </span>
      </button>
    </li>
  );
}
