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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "cn";
import { GripVertical, Plus, Search } from "lucide-react";
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
 * Les routines en CARTES (D216), comme la grille des exercices : pleine largeur sans routine
 * ouverte, dans le panneau de gauche quand une routine s'édite à droite. Une carte se
 * réordonne à la poignée (souris ou clavier : Espace, flèches, Espace) — sauf filtrée : on ne
 * réordonne pas une liste partielle. L'ordre est celui que suit le mobile (D142). La carte
 * ouverte s'enfonce sur une SURFACE, jamais l'orange (D160).
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
    // `block` : sans lui, le contenu de la ScrollArea s'élargit au lieu de couper (piège connu).
    <ScrollArea className="h-full [&_[data-slot=scroll-area-viewport]>div]:block!">
      <section aria-label="Routines" className="flex flex-col gap-5 px-6 py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl">Routines</h1>
          <span className="text-sm text-muted-foreground">{plural(total, "routine")}</span>
        </div>
        {total > 0 ? (
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={filter}
              onChange={(e) => onFilter(e.target.value)}
              placeholder="Rechercher une routine…"
              aria-label="Rechercher une routine"
              className="pl-9"
            />
          </div>
        ) : null}

        {routines.length === 0 && filter.trim() ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucune routine ne correspond à cette recherche.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={drop}>
            <SortableContext items={routines.map((r) => r.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))] gap-4">
                {routines.map((r) => (
                  <RoutineCard
                    key={r.id}
                    routine={r}
                    selected={r.id === selectedId}
                    sortable={!filter.trim()}
                    onClick={() => onSelect(r.id)}
                  />
                ))}
                {/* La création, à la suite des cartes : là où la prochaine routine viendra. */}
                <li className="flex">
                  <button
                    type="button"
                    onClick={onCreate}
                    className="flex w-full items-center justify-center gap-2 rounded-base border-2 border-dashed p-4 border-border text-sm font-bold text-muted-foreground outline-none transition-colors hover:bg-secondary-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Plus aria-hidden="true" className="size-5" />
                    Nouvelle routine
                  </button>
                </li>
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {total === 0 ? (
          // Un compte neuf n'a aucune routine : c'est le tout premier écran qu'on verra.
          <p className="text-sm text-muted-foreground">
            Une routine est un modèle de séance : ses exercices et leurs séries cibles. Le téléphone
            la lance.
          </p>
        ) : null}
      </section>
    </ScrollArea>
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
      className={cn("relative flex", isDragging && "z-10")}
    >
      {/* Toute la carte ouvre la routine ; la poignée, en surimpression, la déplace. */}
      <button
        type="button"
        onClick={onClick}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full flex-col gap-3 rounded-base border-2 border-border bg-secondary-background p-4 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isDragging
            ? // Pendant le glisser, la carte se SOULÈVE : son ombre double (D193).
              "shadow-[8px_8px_0_0_var(--border)]"
            : "shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
          // Ouverte, elle reste enfoncée sur la surface en retrait : une sélection (D160).
          selected && "translate-x-boxShadowX translate-y-boxShadowY bg-muted shadow-none",
        )}
      >
        <span className={cn("flex flex-col gap-0.5", sortable && "pr-8")}>
          <span className="line-clamp-2 text-lg leading-tight font-bold">{r.nom}</span>
          <span className="text-xs text-muted-foreground">
            {plural(r.nbExercices, "exercice")} · {plural(r.nbSeries, "série")}
          </span>
        </span>
      </button>
      {sortable ? (
        <button
          type="button"
          aria-label={`Déplacer « ${r.nom} »`}
          className="absolute top-3 right-3 grid size-8 cursor-grab touch-none place-items-center rounded-base text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </li>
  );
}
