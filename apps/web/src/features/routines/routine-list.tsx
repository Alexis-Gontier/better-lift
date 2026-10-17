import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronRight,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { exerciseBySlug } from "@/mocks/exercises";
import {
  deleteFolder,
  groupByFolder,
  moveRoutine,
  renameFolder,
  setNextRoutineFolder,
  setRenamingFolder,
  useFolders,
  useRenamingFolder,
} from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { DraftRoutineRow, RoutineRow, RoutineRowPreview } from "./routine-card";

/** Sans casse ni accents : « developpe » trouve « Développé ». */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matches(routine: MockRoutine, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const names = routine.exercises.map((e) => exerciseBySlug(e.slug)?.name ?? "");
  return [routine.name, ...names].some((n) => fold(n).includes(q));
}

/** L'identifiant de dépôt d'un dossier : distinct de ceux des routines. */
const dropId = (folder: string) => `dossier:${folder}`;

/** Le nom d'un dossier, en saisie : juste créé, ou « Renommer ». */
function FolderNameInput({ folder }: { folder: string }) {
  return (
    <Input
      aria-label="Nom du dossier"
      defaultValue={folder}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => renameFolder(folder, e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setRenamingFolder(null);
      }}
      className="h-7 flex-1 px-2 font-medium"
    />
  );
}

/** Le menu ⋯ d'un dossier : y créer une routine, le renommer, le supprimer. */
function FolderMenu({ folder }: { folder: string }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Actions du dossier ${folder}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={() => {
            setNextRoutineFolder(folder);
            navigate({ to: "/routines/new", search: true });
          }}
        >
          <Plus /> Nouvelle routine ici
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setRenamingFolder(folder)}>
          <Pencil /> Renommer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            const undo = deleteFolder(folder);
            toast(`Dossier « ${folder} » supprimé`, {
              description: "Ses routines sont dans « Sans dossier ».",
              action: { label: "Annuler", onClick: undo },
            });
          }}
        >
          <Trash2 /> Supprimer le dossier
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Un dossier : sa tête (replier, nombre, menu ⋯) et ses routines. Tout le dossier, tête comprise
 * et même replié, reçoit une routine glissée (D257).
 */
function FolderSection({
  folder,
  routines,
  open,
  onToggle,
}: {
  folder: string;
  routines: MockRoutine[];
  open: boolean;
  onToggle: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId(folder) });
  const renaming = useRenamingFolder() === folder && folder !== "";
  const name = folder || "Sans dossier";
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl transition-shadow",
        isOver && "ring-2 ring-foreground/40 ring-offset-4 ring-offset-background",
      )}
    >
      <div className="flex h-8 items-center gap-1">
        {renaming ? (
          <FolderNameInput folder={folder} />
        ) : (
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="-ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-1 text-left font-medium text-sm transition-colors hover:bg-muted/60"
          >
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
            <span className={cn("truncate", !folder && "text-muted-foreground")}>{name}</span>
            <span className="text-muted-foreground tabular-nums">{routines.length}</span>
          </button>
        )}
        {folder && !renaming && <FolderMenu folder={folder} />}
      </div>
      {open &&
        (routines.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-5 text-center text-muted-foreground text-sm">
            Glissez une routine ici
          </div>
        ) : (
          // Une carte par routine, séparées (D258).
          <div className="flex flex-col gap-2">
            {routines.map((r) => (
              <RoutineRow key={r.id} routine={r} />
            ))}
          </div>
        ))}
    </section>
  );
}

/**
 * Les routines rangées par dossier (D257) : des sections repliables, une recherche qui ne montre
 * que les dossiers ayant un résultat (dépliés), et la poignée de chaque ligne pour changer une
 * routine de dossier.
 */
export function RoutineList({ routines }: { routines: MockRoutine[] }) {
  const [query, setQuery] = useState("");
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set());
  const [dragged, setDragged] = useState<MockRoutine | null>(null);
  const folderNames = useFolders();
  const creating = useRouterState({ select: (s) => s.location.pathname === "/routines/new" });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const searching = query.trim() !== "";
  const groups = groupByFolder(
    routines.filter((r) => matches(r, query)),
    folderNames,
  ).filter((g) => !searching || g.items.length > 0);

  function onDragEnd({ active, over }: DragEndEvent) {
    setDragged(null);
    const target = over?.id;
    if (typeof target !== "string" || !target.startsWith("dossier:")) return;
    const folder = target.slice("dossier:".length);
    const routine = routines.find((r) => r.id === active.id);
    if (!routine || routine.folder === folder) return;
    moveRoutine(routine.id, folder);
    toast.success(`« ${routine.name} » rangée dans « ${folder || "Sans dossier"} »`, {
      id: "routine-rangee",
      action: { label: "Annuler", onClick: () => moveRoutine(routine.id, routine.folder) },
    });
  }

  return (
    <>
      <InputGroup>
        <InputGroupInput
          placeholder="Rechercher une routine ou un exercice…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>

      {creating && <DraftRoutineRow />}

      {searching && groups.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucune routine ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setDragged(routines.find((r) => r.id === active.id) ?? null)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragged(null)}
        >
          <div className="flex flex-col gap-5">
            {groups.map((g) => (
              <FolderSection
                key={g.folder || "-"}
                folder={g.folder}
                routines={g.items}
                open={searching || !closed.has(g.folder)}
                onToggle={() =>
                  setClosed((c) => {
                    const next = new Set(c);
                    if (next.has(g.folder)) next.delete(g.folder);
                    else next.add(g.folder);
                    return next;
                  })
                }
              />
            ))}
          </div>
          <DragOverlay>{dragged && <RoutineRowPreview routine={dragged} />}</DragOverlay>
        </DndContext>
      )}
    </>
  );
}

export function RoutineListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-16 rounded-xl" />
    </>
  );
}

export function RoutineListEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListChecks />
        </EmptyMedia>
        <EmptyTitle>Pas encore de routine</EmptyTitle>
        <EmptyDescription>
          Une routine prépare une séance : ses exercices, ses séries et ses temps de repos.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/routines/new">Créer une routine</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
