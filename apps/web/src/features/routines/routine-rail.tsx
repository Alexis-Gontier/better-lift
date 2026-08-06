"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
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
import {
  ChevronRightIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useDeleteRoutine,
  useDuplicateRoutine,
  useReorderRoutines,
  useRoutineFolders,
  useRoutines,
  useUpdateRoutine,
} from "@better-lift/api-client";
import { Alert, AlertDescription, AlertTitle } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@better-lift/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@better-lift/ui/components/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@better-lift/ui/components/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@better-lift/ui/components/input-group";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";
import { cn } from "@better-lift/ui/lib/utils";
import { type RoutineFolder, type RoutineSummary } from "@better-lift/validators";

import { CreateFolderDialog, DeleteFolderDialog, RenameFolderDialog } from "./folder-dialogs";
import { apiClient } from "@/lib/api";

/**
 * Colonne de navigation des routines (volet gauche de `/routines`).
 *
 * Elle remplace l'ancienne page-liste : la liste n'était consultée que pour
 * choisir quoi ouvrir, et repasser par elle entre deux routines coûtait un
 * aller-retour complet. Ici elle vit dans le **layout** du segment, donc elle
 * survit à la navigation — React ne la remonte pas, TanStack Query ne
 * refetch pas, et passer de « Push A » à « Legs A » ne recharge que le volet
 * droit.
 *
 * ## Trois partis pris
 *
 * 1. **Une routine se rejoint par son URL**, pas par un état de sélection.
 *    C'est ce qui garde le bouton Précédent, le partage de lien et l'ouverture
 *    dans un nouvel onglet — trois choses qu'un panneau piloté par `useState`
 *    perd d'un coup.
 * 2. **Le filtre est local et non dans l'URL**, contrairement au catalogue : ici
 *    l'URL désigne déjà ce qu'on édite, et y ajouter un filtre ferait deux
 *    sujets dans une même adresse. La liste arrive entière et non paginée, le
 *    filtrage côté client n'a donc aucun coût réseau.
 * 3. **Les dossiers vides restent visibles** tant qu'on ne filtre pas : c'est le
 *    seul endroit d'où on peut les supprimer, et un dossier qu'on vient de
 *    créer doit se voir (doc 05).
 */

/** Clé de groupe des routines sans dossier. Jamais un identifiant réel. */
const NO_FOLDER = "__none__";

/**
 * Ce que le lecteur d'écran entend pendant un déplacement au clavier.
 *
 * Sans ces messages, `dnd-kit` annonce des cuid : « cmse75hxj0008… est
 * déplacé ». La colonne étant réordonnable, on a besoin de savoir où on en
 * est, pas quelle clé on tient.
 */
const announcements = {
  onDragStart: () => "Routine saisie. Flèches pour la déplacer, Entrée pour déposer.",
  onDragOver: () => "Position en cours de changement.",
  onDragEnd: () => "Routine déposée.",
  onDragCancel: () => "Déplacement annulé, la routine retrouve sa place.",
};

function matches(routine: RoutineSummary, needle: string): boolean {
  return needle === "" || routine.name.toLocaleLowerCase().includes(needle);
}

/** Un dossier (ou « sans dossier ») et les routines qu'il contient, dans l'ordre d'affichage. */
type RoutineGroup = { key: string; folder: RoutineFolder | null; routines: RoutineSummary[] };

/** Le groupe qui contient une routine, ou celui dont `key` est visé directement (son vide). */
function locateGroup(groups: readonly RoutineGroup[], id: string): RoutineGroup | undefined {
  return (
    groups.find((group) => group.routines.some((routine) => routine.id === id)) ??
    groups.find((group) => group.key === id)
  );
}

// ── Une routine ───────────────────────────────────────────────────────────

function RoutineLink({ routine, active }: { routine: RoutineSummary; active: boolean }) {
  const router = useRouter();
  const duplicate = useDuplicateRoutine(apiClient);
  const remove = useDeleteRoutine(apiClient);
  const [confirming, setConfirming] = useState(false);

  const busy = duplicate.isPending || remove.isPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: routine.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group/routine relative", isDragging && "z-10 opacity-60")}
    >
      {/*
        Une carte, et la poignée en est le **flanc gauche** : elle n'est pas
        posée à côté mais fait partie du cadre, séparée par un filet. C'est ce
        qui la rend saisissable sur toute la hauteur sans avoir l'air d'un
        bouton perdu dans la marge.

        `overflow-hidden` n'est pas décoratif : sans lui, le fond de la
        poignée déborde des coins arrondis de la carte.
      */}
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-lg border transition-colors",
          active ? "border-foreground/30 bg-accent" : "border-border hover:bg-accent/50",
        )}
      >
        {/*
          `touch-none` est indispensable et non décoratif : sans lui, le
          navigateur mobile prend le geste pour un défilement et le glissement
          ne démarre jamais.
        */}
        <button
          type="button"
          aria-label={`Déplacer ${routine.name}`}
          className="flex w-7 shrink-0 cursor-grab touch-none items-center justify-center border-r border-border bg-muted/40 text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-3.5" />
        </button>

        {/*
          Le lien occupe tout le reste et le menu se pose **par-dessus** : côte
          à côte dans le flux, ils réduiraient la cible cliquable du lien à son
          texte, alors que c'est le geste principal. Le menu n'est pas un
          enfant du lien — un bouton dans un lien est du balisage invalide, et
          le clic partirait naviguer avant d'ouvrir le menu.
        */}
        <Link
          href={`/routines/${routine.id}`}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex min-h-13 min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pr-10 pl-3 text-sm",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            // L'état actif est marqué par le fond **et** la graisse : le fond
            // seul est celui du survol, et les deux se confondraient (doc 05).
            active ? "font-medium text-accent-foreground" : "text-foreground",
          )}
        >
          <span className="truncate">{routine.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {routine.exerciseCount} exercice{routine.exerciseCount > 1 ? "s" : ""} ·{" "}
            {routine.setCount} série{routine.setCount > 1 ? "s" : ""}
          </span>
        </Link>
      </div>

      {confirming ? (
        <div className="flex items-center gap-1 px-2 pt-1 pb-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              remove.mutate(routine.id, {
                onSuccess: () => {
                  // On quitte l'écran de ce qui vient de disparaître : y
                  // rester afficherait un 404 sur une suppression réussie.
                  if (active) {
                    router.push("/routines");
                  }

                  toast.success(`« ${routine.name} » supprimée.`);
                },
                onError: (error) => toast.error(error.message),
              });
            }}
            disabled={remove.isPending}
            aria-busy={remove.isPending}
          >
            {remove.isPending && <Spinner data-icon="inline-start" />}
            Supprimer
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions sur ${routine.name}`}
              disabled={busy}
              className={cn(
                "absolute top-2.5 right-1.5 text-muted-foreground",
                // Toujours présent au clavier et au toucher ; discret à la
                // souris tant qu'on ne survole pas la ligne. `focus-visible`
                // le fait réapparaître, sans quoi il serait focalisable mais
                // invisible — le pire des deux mondes.
                "opacity-100 md:opacity-0 md:group-hover/routine:opacity-100 md:focus-visible:opacity-100",
                "data-[state=open]:opacity-100",
              )}
            >
              {busy ? <Spinner /> : <MoreHorizontalIcon />}
            </Button>
          </DropdownMenuTrigger>

          {/*
            Plus d'entrée « Modifier » : le lien de la ligne ouvre déjà la
            routine en modification. La garder aurait fait deux chemins vers le
            même écran, dont l'un caché derrière un menu.
          */}
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() =>
                duplicate.mutate(routine.id, {
                  onSuccess: (copy) => {
                    // On atterrit dans la copie : c'est ce qu'on vient créer,
                    // et le toast dit ce qui s'est passé pendant que l'écran
                    // change sous les yeux.
                    router.push(`/routines/${copy.id}`);
                    toast.success(`« ${copy.name} » créée à partir de « ${routine.name} ».`);
                  },
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              Supprimer…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

/**
 * Ce que `DragOverlay` fait flotter sous le curseur pendant un glissement.
 *
 * `useSortable` déplace déjà la ligne d'origine, mais seulement **à
 * l'intérieur de son propre `SortableContext`** : passer d'un dossier à un
 * autre change de contexte, et rien n'y montrait alors le geste en train de
 * se faire — la carte réapparaissait toute faite dans le nouveau dossier une
 * fois la souris relâchée. La carte flottante, elle, suit le curseur pendant
 * tout le trajet et par-dessus les groupes, ce qui donne enfin ce retour :
 * on voit ce qu'on tient, et où ça va atterrir.
 *
 * Statique à dessein : pas de poignée, pas de menu, rien à activer sur une
 * carte qui n'est pas dans le DOM réel.
 */
function RoutineDragPreview({ routine }: { routine: RoutineSummary }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-foreground/30 bg-card shadow-lg">
      <div className="flex w-7 shrink-0 items-center justify-center border-r border-border bg-muted/40 text-muted-foreground">
        <GripVerticalIcon className="size-3.5" />
      </div>
      <div className="flex min-h-13 min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pr-3 pl-3 text-sm">
        <span className="truncate font-medium">{routine.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {routine.exerciseCount} exercice{routine.exerciseCount > 1 ? "s" : ""} ·{" "}
          {routine.setCount} série{routine.setCount > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ── Un dossier ────────────────────────────────────────────────────────────

function FolderGroup({
  groupKey,
  folder,
  routines,
  activeId,
  defaultOpen,
}: {
  /** Identifiant de la zone de dépose : celui du dossier, ou `NO_FOLDER`. */
  groupKey: string;
  folder: RoutineFolder | null;
  routines: readonly RoutineSummary[];
  activeId: string | null;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /**
   * Le groupe est lui-même une zone de dépose, en plus de ses routines.
   *
   * Sans elle, un dossier **vide** n'aurait aucune cible : rien à survoler,
   * donc aucun moyen d'y ranger quoi que ce soit. Or un dossier qu'on vient de
   * créer est précisément vide, et c'est le moment où on veut le remplir.
   */
  const { setNodeRef, isOver } = useDroppable({ id: groupKey });

  const label = folder?.name ?? "Sans dossier";

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col">
      <div className="flex items-center gap-1">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 min-w-0 flex-1 justify-start gap-1.5 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground",
              /*
                La variante `ghost` remplit le fond sur `aria-expanded` — sa
                convention pour un déclencheur de menu. Ici le déclencheur est
                *déplié* la plupart du temps : chaque dossier ouvert prendrait
                le même fond que la routine active, et « où je suis » se
                perdrait dans trois bandeaux identiques. Le survol garde le
                sien, lui est passager.
              */
              "aria-expanded:bg-transparent aria-expanded:text-muted-foreground",
              "hover:aria-expanded:bg-muted hover:aria-expanded:text-foreground",
            )}
          >
            {/*
              La flèche tourne plutôt que de changer d'icône : deux glyphes
              différents pour un même bouton font clignoter la ligne, et la
              rotation dit la même chose. Elle est neutralisée par le bloc
              `prefers-reduced-motion` de `globals.css`.
            */}
            <ChevronRightIcon
              aria-hidden="true"
              className={cn("size-3.5 transition-transform", open && "rotate-90")}
            />
            <span className="truncate">{label}</span>
            <span className="font-normal tracking-normal normal-case">({routines.length})</span>
          </Button>
        </CollapsibleTrigger>

        {/*
          Seul un vrai dossier se renomme ou se supprime. « Sans dossier »
          n'est pas une ligne en base : c'est le reste, il n'y a rien à éditer.
        */}
        {folder && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions sur le dossier ${folder.name}`}
                className="text-muted-foreground"
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRenaming(true)}>Renommer…</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                Supprimer…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {folder && (
        <>
          <RenameFolderDialog folder={folder} open={renaming} onOpenChange={setRenaming} />
          <DeleteFolderDialog
            folder={folder}
            routineCount={routines.length}
            open={deleting}
            onOpenChange={setDeleting}
          />
        </>
      )}

      <CollapsibleContent>
        {/*
          `ref` sur le conteneur du groupe, `SortableContext` à l'intérieur :
          survoler n'importe où dans le dossier — y compris son vide — en fait
          une cible. C'est ce qui permet de ranger une routine dans un dossier
          fraîchement créé, qui n'a encore aucune ligne à survoler.
        */}
        <div
          ref={setNodeRef}
          className={cn(
            "rounded-lg transition-colors",
            isOver && "bg-accent/40 outline-2 outline-offset-2 outline-dashed outline-border",
            routines.length === 0 && "min-h-11",
          )}
        >
          {routines.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              {folder
                ? "Dossier vide — déposez-y une routine."
                : "Toutes les routines sont rangées."}
            </p>
          ) : (
            <SortableContext
              items={routines.map((routine) => routine.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-1.5">
                {routines.map((routine) => (
                  <RoutineLink
                    key={routine.id}
                    routine={routine}
                    active={routine.id === activeId}
                  />
                ))}
              </ul>
            </SortableContext>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Le volet ──────────────────────────────────────────────────────────────

export function RoutineRail() {
  const pathname = usePathname();
  const fieldId = useId();
  const [query, setQuery] = useState("");

  const folders = useRoutineFolders(apiClient);
  const routines = useRoutines(apiClient);
  const reorder = useReorderRoutines(apiClient);
  const move = useUpdateRoutine(apiClient);
  const [creating, setCreating] = useState(false);

  /**
   * L'identifiant courant se lit dans l'URL et non dans un état : le volet
   * doit se surligner correctement après un rechargement, un retour arrière ou
   * l'ouverture directe d'un lien.
   */
  const activeId = useMemo(() => {
    const segments = pathname.split("/");

    return segments[1] === "routines" && segments[2] && segments[2] !== "new" ? segments[2] : null;
  }, [pathname]);

  const needle = query.trim().toLocaleLowerCase();

  const groups = useMemo(() => {
    const all = (routines.data ?? []).filter((routine) => matches(routine, needle));

    const byFolder = [
      ...(folders.data ?? []).map((folder) => ({
        key: folder.id,
        folder,
        routines: all.filter((routine) => routine.folderId === folder.id),
      })),
      {
        key: NO_FOLDER,
        folder: null,
        routines: all.filter((routine) => routine.folderId === null),
      },
    ];

    // Pendant une recherche, un groupe sans résultat n'est que du bruit à
    // parcourir. Hors recherche il reste affiché : c'est là qu'on supprime un
    // dossier, et un dossier neuf est vide par définition.
    return needle === "" ? byFolder : byFolder.filter((group) => group.routines.length > 0);
  }, [folders.data, routines.data, needle]);

  const total = routines.data?.length ?? 0;

  const sensors = useSensors(
    // 6 px de seuil : sans lui, le moindre tremblement sur la poignée est pris
    // pour un début de glissement — et la poignée borde un lien.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /**
   * Copie de travail de `groups`, qui n'existe que **pendant** un glissement.
   *
   * `useSortable` anime déjà le réordonnancement à l'intérieur d'un même
   * `SortableContext`, mais un dossier en est un différent : passer de l'un à
   * l'autre ne bougeait donc rien à l'écran avant la dépose, alors que le
   * geste avait bien lieu — juste invisible. `onDragOver` fait migrer la
   * routine saisie vers le groupe survolé au fil du geste, et le rendu suit
   * cette copie tant qu'elle existe. `onDragEnd` continue de calculer le
   * résultat à partir de `groups`, la donnée stable : ce state n'est là que
   * pour le retour visuel, jamais pour décider quoi envoyer au serveur.
   */
  const [dragGroups, setDragGroups] = useState<RoutineGroup[] | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<RoutineSummary | null>(null);
  const displayGroups = dragGroups ?? groups;

  function onDragStart(event: DragStartEvent) {
    const routine = groups
      .flatMap((group) => group.routines)
      .find((entry) => entry.id === event.active.id);

    setActiveRoutine(routine ?? null);
    setDragGroups(groups.map((group) => ({ ...group, routines: [...group.routines] })));
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    setDragGroups((current) => {
      if (!current) {
        return current;
      }

      const from = locateGroup(current, String(active.id));
      const to = locateGroup(current, String(over.id));

      // Un survol à l'intérieur du même dossier ne demande rien ici :
      // `useSortable` s'en charge tout seul dans son propre contexte.
      if (!from || !to || from.key === to.key) {
        return current;
      }

      const moving = from.routines.find((routine) => routine.id === active.id);

      if (!moving) {
        return current;
      }

      const insertAt = to.routines.findIndex((routine) => routine.id === over.id);

      return current.map((group) => {
        if (group.key === from.key) {
          return {
            ...group,
            routines: group.routines.filter((routine) => routine.id !== active.id),
          };
        }

        if (group.key === to.key) {
          const nextRoutines = [...group.routines];

          nextRoutines.splice(insertAt === -1 ? nextRoutines.length : insertAt, 0, moving);

          return { ...group, routines: nextRoutines };
        }

        return group;
      });
    });
  }

  function onDragCancel() {
    setDragGroups(null);
    setActiveRoutine(null);
  }

  /**
   * Un glissement fait deux choses, et il faut les distinguer.
   *
   * **Réordonner** dans le même dossier : un seul appel, l'ordre complet.
   * **Changer de dossier** : un `PATCH` sur la routine, puis l'ordre complet.
   *
   * Le serveur reçoit toujours **l'ordre complet, tous dossiers confondus**.
   * `position` est globale en base, pas relative au dossier : n'envoyer que
   * les identifiants d'un dossier leur donnerait les positions 0..n, en
   * collision avec celles des autres, et l'ordre entre groupes deviendrait
   * indéterminé. On aplatit donc les groupes dans leur ordre d'affichage —
   * ce que `reorderSchema` attend de toute façon, jamais un déplacement
   * relatif.
   */
  function onDragEnd(event: DragEndEvent) {
    // La copie de travail a fini son office — le calcul qui suit part de
    // `groups`, qui n'a pas bougé pendant le geste.
    setDragGroups(null);
    setActiveRoutine(null);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const source = groups.find((entry) =>
      entry.routines.some((routine) => routine.id === active.id),
    );

    /*
      La cible est soit une routine — on se place à côté d'elle —, soit le
      conteneur d'un groupe, quand on lâche dans son vide. Le second cas est
      ce qui rend un dossier fraîchement créé atteignable.
    */
    const target =
      groups.find((entry) => entry.routines.some((routine) => routine.id === over.id)) ??
      groups.find((entry) => entry.key === over.id);

    if (!source || !target) {
      return;
    }

    const moving = source.routines.find((routine) => routine.id === active.id);

    if (!moving) {
      return;
    }

    // Position d'arrivée : devant la routine survolée, ou en fin de dossier si
    // c'est le vide du groupe qu'on a visé.
    const insertAt = target.routines.findIndex((routine) => routine.id === over.id);

    const nextByGroup = new Map(groups.map((entry) => [entry.key, [...entry.routines]] as const));

    if (source.key === target.key) {
      const from = source.routines.findIndex((routine) => routine.id === active.id);

      nextByGroup.set(source.key, arrayMove([...source.routines], from, insertAt));
    } else {
      nextByGroup.set(
        source.key,
        source.routines.filter((routine) => routine.id !== active.id),
      );

      const destination = [...target.routines];

      destination.splice(insertAt === -1 ? destination.length : insertAt, 0, moving);
      nextByGroup.set(target.key, destination);
    }

    const ids = groups.flatMap((entry) =>
      (nextByGroup.get(entry.key) ?? entry.routines).map((routine) => routine.id),
    );

    if (source.key === target.key) {
      // Pas de toast sur un simple réordonnancement : le résultat est sous les
      // yeux, à l'endroit exact où on vient de lâcher. Seul l'échec parle.
      reorder.mutate(ids, { onError: (error) => toast.error(error.message) });
      return;
    }

    /*
      Le dossier d'abord, l'ordre ensuite : l'inverse rangerait les positions
      d'une routine encore rattachée à son ancien dossier, et le second appel
      les réécrirait. Deux requêtes plutôt qu'une parce que le contrat les
      sépare — `PUT /routines/reorder` ne connaît que des positions, et le
      dossier est une métadonnée (doc 04).
    */
    move.mutate(
      { id: moving.id, input: { folderId: target.folder?.id ?? null } },
      {
        onSuccess: () => {
          reorder.mutate(ids, { onError: (error) => toast.error(error.message) });

          // Un changement de dossier peut refermer le groupe d'arrivée ou le
          // sortir de la vue : c'est le cas où le résultat n'est pas
          // forcément là où on a lâché.
          toast.success(
            target.folder
              ? `« ${moving.name} » rangée dans « ${target.folder.name} ».`
              : `« ${moving.name} » sortie de son dossier.`,
          );
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    /*
      `<nav>` et non un simple `<aside>` : c'est une liste de destinations, et
      « aller à la navigation » doit pouvoir y mener. Le libellé la distingue de
      la navigation principale de l'application, qui porte déjà ce repère.
    */
    <nav aria-label="Routines" className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/routines/new">
            <PlusIcon />
            Nouvelle routine
          </Link>
        </Button>

        {/* Un filtre sur deux routines ne sert à rien et occupe une ligne. */}
        {total > 4 && (
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              id={`${fieldId}-filter`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrer…"
              autoComplete="off"
              aria-label="Filtrer les routines par nom"
            />
          </InputGroup>
        )}
      </div>

      {(routines.isPending || folders.isPending) && (
        <div className="flex flex-col gap-1.5" aria-busy>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-11 rounded-md" />
          ))}
        </div>
      )}

      {routines.isError && (
        <Alert variant="destructive">
          <AlertTitle>Routines indisponibles.</AlertTitle>
          <AlertDescription>{routines.error.message}</AlertDescription>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-fit"
            onClick={() => void routines.refetch()}
          >
            Réessayer
          </Button>
        </Alert>
      )}

      {routines.isSuccess && total === 0 && (
        <Empty className="px-0">
          <EmptyHeader>
            <EmptyTitle>Aucune routine.</EmptyTitle>
            <EmptyDescription>
              Une routine est un gabarit de séance. Elle ne bouge pas quand vous vous entraînez.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild size="sm">
              <Link href="/routines/new">Créer la première</Link>
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {routines.isSuccess && total > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {groups.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              Aucune routine ne porte ce nom.
            </p>
          ) : (
            /*
              Un seul `DndContext` pour toute la colonne, avec un
              `SortableContext` par dossier : deux contextes imbriqués rendent
              le routage des événements dépendant de l'ordre de montage, piège
              déjà payé dans l'éditeur (doc 05).
            */
            <DndContext
              sensors={sensors}
              /*
                `closestCorners` et non `closestCenter` : avec plusieurs
                conteneurs, le centre d'un dossier vide est loin de tout, et il
                ne gagne jamais contre la routine la plus proche. Les coins le
                rendent atteignable — c'est la recommandation de `dnd-kit` pour
                le multi-conteneurs.
              */
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDragCancel={onDragCancel}
              accessibility={{ announcements }}
            >
              {displayGroups.map((group) => (
                <FolderGroup
                  key={group.key}
                  groupKey={group.key}
                  folder={group.folder}
                  routines={group.routines}
                  activeId={activeId}
                  // Repliés d'office au-delà de six dossiers : la colonne
                  // deviendrait sinon plus longue que l'écran avant d'avoir
                  // montré une seule routine.
                  defaultOpen={groups.length <= 6 || group.routines.some((r) => r.id === activeId)}
                />
              ))}

              {/*
                Deux retours combinés : la ligne d'origine (`RoutineLink`,
                allégée à `opacity-60`) migre réellement vers le dossier
                survolé — c'est `onDragOver` qui la fait changer de groupe —
                pendant qu'une carte flottante suit le curseur par-dessus
                tout, `DragOverlay` n'étant pas contraint à un conteneur.
              */}
              <DragOverlay>
                {activeRoutine && <RoutineDragPreview routine={activeRoutine} />}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}

      {routines.isSuccess && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground"
            onClick={() => setCreating(true)}
          >
            <PlusIcon />
            Nouveau dossier
          </Button>

          <CreateFolderDialog open={creating} onOpenChange={setCreating} />
        </>
      )}
    </nav>
  );
}
