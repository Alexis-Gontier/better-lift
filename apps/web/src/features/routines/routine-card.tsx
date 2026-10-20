import {
  dureeRoutine,
  ilYa,
  musclesRoutine,
  type RoutineResume,
  versBrouillon,
  versSaisie,
} from "@better-lift/shared";
import { useDraggable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ChevronRight, Copy, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listCardClass, listLinkProps } from "@/components/list-detail";
import { type RowAction, RowMenu } from "@/components/row-menu";
import { Card } from "@/components/ui/card";
import { plural } from "@/lib/format";
import { joursDepuis, SYSTEME } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { nomBrouillon } from "./ecran";
import { routineQuery, useCreerRoutine, useSupprimerRoutine } from "./queries";

const rowClass = "flex items-center gap-3 px-4 py-3";

/** Le clic droit sur une routine : les mêmes actions que son menu ⋯. */
function useRoutineActions(routine: RoutineResume): RowAction[] {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { id: ouverte } = useParams({ strict: false });
  const creer = useCreerRoutine();
  const supprimer = useSupprimerRoutine();
  return [
    {
      label: "Dupliquer",
      icon: Copy,
      onSelect: async () => {
        try {
          // La copie part du détail : le résumé n'a pas les séries.
          const detail = await client.fetchQuery(routineQuery(routine.id));
          const nom = `${routine.nom} (copie)`.slice(0, 120);
          const id = await creer.mutateAsync({
            ...versSaisie(versBrouillon(detail, SYSTEME), SYSTEME),
            nom,
          });
          navigate({ to: "/routines/$id", params: { id }, search: true });
          toast.success(`« ${nom} » créée`);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "La routine n'a pas pu être dupliquée.");
        }
      },
    },
    {
      label: "Supprimer",
      icon: Trash2,
      destructive: true,
      separated: true,
      onSelect: () => {
        if (ouverte === routine.id) navigate({ to: "/routines", search: true });
        supprimer(routine.id, `« ${routine.nom} » supprimée`);
      },
    },
  ];
}

/** Le contenu d'une ligne de routine : nom et muscles, durée et dernière fois. */
function RowBody({ routine }: { routine: RoutineResume }) {
  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{routine.nom}</span>
        <span className="truncate text-muted-foreground text-xs">
          {[plural(routine.nbExercices, "exercice"), ...musclesRoutine(routine)].join(" · ")}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="text-sm tabular-nums">{dureeRoutine(routine.dureeEstimeeSec)}</span>
        <span className="text-muted-foreground text-xs">
          {ilYa(routine.derniereSeance ? joursDepuis(routine.derniereSeance) : null)}
        </span>
      </div>
    </>
  );
}

/**
 * Une routine dans la liste, en ligne compacte (D251) ; sa poignée la glisse dans un autre
 * dossier (D257).
 */
export function RoutineRow({ routine }: { routine: RoutineResume }) {
  const actions = useRoutineActions(routine);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: routine.id,
  });
  return (
    <Card ref={setNodeRef} className={cn(listCardClass, isDragging && "opacity-40")}>
      {/* Un vrai bouton : sans focus possible, la poignée ne répondrait pas au clavier. */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Changer de dossier : ${routine.nom}`}
        className="flex w-7 shrink-0 cursor-grab items-center justify-center text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <RowMenu actions={actions}>
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
export function RoutineRowPreview({ routine }: { routine: RoutineResume }) {
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg">
      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      <RowBody routine={routine} />
    </div>
  );
}

/** La ligne de la routine en cours de création, en tête de liste (D238) : elle suit le nom tapé. */
export function DraftRoutineRow() {
  const name = nomBrouillon.use();
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
