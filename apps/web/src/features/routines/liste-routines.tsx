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
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  routines: RoutineResume[];
  idSelectionne?: string;
  onSelection: (id: string) => void;
  onCreer: () => void;
  onOrdonner: (ids: string[]) => void;
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * La colonne des routines (D142) : l'action en tête — le seul aplat de l'écran —,
 * puis une carte par routine, réordonnable par la poignée (souris ou clavier).
 * La carte choisie est une SURFACE, pas une couleur : le lime reste à l'action.
 */
export function ListeRoutines({
  routines,
  idSelectionne,
  onSelection,
  onCreer,
  onOrdonner,
}: Props) {
  const capteurs = useSensors(
    // 4 px avant de démarrer : sans ce seuil, un clic sur la poignée serait un glisser.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const deposer = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = routines.map((r) => r.id);
    onOrdonner(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  return (
    <section aria-label="Routines" className="flex h-full flex-col">
      <header className="flex flex-col gap-3 px-5 pt-6 pb-3">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-tight">Routines</h2>
          <p className="text-[13px] text-(--ink-muted)">{pluriel(routines.length, "routine")}</p>
        </div>
        <Button onClick={onCreer} className="w-full rounded-[10px] font-bold">
          <Plus aria-hidden="true" />
          Nouvelle routine
        </Button>
      </header>

      {/* Un compte neuf n'a aucune routine : c'est le tout premier écran qu'on verra. */}
      {routines.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-(--ink-subtle)">
          Aucune routine pour l'instant. Une routine est un modèle de séance : ses exercices et
          leurs séries cibles.
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
          <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={deposer}>
            <SortableContext
              items={routines.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-1 px-2.5 pb-3">
                {routines.map((r) => (
                  <CarteRoutine
                    key={r.id}
                    routine={r}
                    choisie={r.id === idSelectionne}
                    onClick={() => onSelection(r.id)}
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

function CarteRoutine({
  routine: r,
  choisie,
  onClick,
}: {
  routine: RoutineResume;
  choisie: boolean;
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
        "group flex items-center rounded-xl",
        choisie ? "bg-(--surface-3)" : "hover:bg-(--surface-2)",
        isDragging && "relative z-10 bg-(--surface-3) shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label={`Déplacer « ${r.nom} »`}
        className="cursor-grab touch-none self-stretch rounded-l-xl pl-1.5 text-(--ink-faint) opacity-0 outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        onClick={onClick}
        aria-current={choisie ? "true" : undefined}
        className="min-w-0 flex-1 rounded-r-xl px-2 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
      >
        <span className="block truncate font-bold">{r.nom}</span>
        <span className="mt-0.5 block text-[12.5px] text-(--ink-muted)">
          {pluriel(r.nbExercices, "exercice")} · {pluriel(r.nbSeries, "série")}
        </span>
      </button>
    </li>
  );
}
