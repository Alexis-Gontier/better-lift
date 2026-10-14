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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  /** Les routines affichées, déjà filtrées. */
  routines: RoutineResume[];
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
      {/* Une seule ligne (D215) : la recherche et l'action, à la hauteur des contrôles. */}
      <header className="flex items-center gap-2 border-b-2 border-border px-3 py-3">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher une routine"
            className="pl-9"
          />
        </div>
        {/* Carré, pour laisser la place à la recherche dans une colonne étroite. */}
        <Button
          variant="outline"
          size="icon"
          onClick={onCreate}
          aria-label="Nouvelle routine"
          title="Nouvelle routine"
        >
          <Plus aria-hidden="true" />
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
        "group flex items-center border-b-2 border-border",
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
        className="min-w-0 flex-1 py-3 pr-3 pl-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-bold">{r.nom}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {plural(r.nbSeries, "série")}
          </span>
        </span>
        {/* L'aperçu de ses exercices (D215) : on reconnaît une routine à ce qu'elle contient. */}
        <span className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
          {r.apercu.length ? r.apercu.join(" · ") : "Aucun exercice"}
        </span>
      </button>
    </li>
  );
}
