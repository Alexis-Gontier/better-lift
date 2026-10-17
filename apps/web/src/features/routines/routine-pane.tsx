import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Redo2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { toast } from "sonner";
import { DetailHeader } from "@/components/list-detail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { plural } from "@/lib/format";
import { useWidth } from "@/lib/use-width";
import {
  deleteRoutine,
  newRoutineId,
  peekNextRoutineFolder,
  saveRoutine,
  setDraftName,
  setNextRoutineFolder,
} from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { useDraftHistory } from "./draft-history";
import {
  changeSummary,
  type Draft,
  fromDraft,
  isDirty,
  saveBlocker,
  toDraft,
} from "./routine-draft";
import { RoutineFields, RoutineNameInput } from "./routine-editor";
import { RoutineOverview } from "./routine-overview";

/** Le menu ⋯ de la routine : ce qui ne se modifie pas champ par champ. */
function RoutineMenu({ routine, release }: { routine: MockRoutine; release?: () => void }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  function duplicate() {
    const copy = {
      ...routine,
      id: newRoutineId(),
      name: `${routine.name} (copie)`,
      lastDone: null,
    };
    saveRoutine(copy);
    release?.();
    navigate({ to: "/routines/$id", params: { id: copy.id }, search: true });
    toast.success(`« ${copy.name} » créée`);
  }

  function remove() {
    deleteRoutine(routine.id);
    release?.();
    navigate({ to: "/routines", search: true });
    toast(`« ${routine.name} » supprimée`, {
      action: { label: "Annuler", onClick: () => saveRoutine(routine) },
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Actions de la routine">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => navigate({ to: "/planning" })}>
            Planifier
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={duplicate}>Dupliquer</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {routine.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les séances déjà faites restent dans l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Défilement du contenu d'une `ScrollArea` : il s'étire en largeur au lieu de couper sinon. */
const scrollBlock =
  "h-full [&_[data-slot=scroll-area-viewport]]:overscroll-contain [&_[data-slot=scroll-area-viewport]>div]:block!";

/**
 * Sous la tête fixe, deux panneaux redimensionnables qui défilent chacun dans sa `ScrollArea`
 * (D255) : les exercices, et à droite les chiffres, les muscles et les réglages. La largeur est
 * mémorisée, comme celle de la liste | détail.
 */
function EditorLayout({ main, aside }: { main: React.ReactNode; aside: React.ReactNode }) {
  const layout = useDefaultLayout({ id: "routine-editeur", storage: localStorage });
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const width = useWidth(box);
  // Trop étroit pour deux colonnes (480 + 220 px) : la colonne de droite passe sous les exercices.
  const stacked = width !== null && width < 720;
  return (
    // Le bloc porte la hauteur : le groupe impose `height: 100%` en style en ligne.
    <div ref={setBox} className="-mx-6 -mt-6 -mb-6 min-h-0 flex-1">
      {stacked ? (
        <ScrollArea className={scrollBlock}>
          <div className="flex min-w-0 flex-col gap-3 px-6 pt-6 *:shrink-0">{main}</div>
          <aside className="@container flex flex-col gap-4 px-6 pt-6 pb-24 *:shrink-0">
            {aside}
          </aside>
        </ScrollArea>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          defaultLayout={layout.defaultLayout}
          onLayoutChanged={layout.onLayoutChanged}
        >
          {/* 480 px : le tableau des séries, « Dernière fois » effacée ; en dessous, il serait coupé. */}
          <ResizablePanel id="exercices" defaultSize="74%" minSize="480px">
            <ScrollArea className={scrollBlock}>
              <div className="flex min-w-0 flex-col gap-3 px-6 pt-6 pb-24 *:shrink-0">{main}</div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="apercu" defaultSize="26%" minSize="220px" maxSize="50%">
            <ScrollArea className={scrollBlock}>
              <aside className="@container flex flex-col gap-4 px-6 pt-6 pb-24 *:shrink-0">
                {aside}
              </aside>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}

const saved = () => toast.success("Routine enregistrée", { id: "routine-enregistree" });

/** Ctrl (⌘ sur Mac) Z annule, Ctrl Maj Z ou Ctrl Y rétablit, Ctrl S enregistre (D261). */
function useEditorKeys(keys: { undo: () => void; redo: () => void; save: () => void }) {
  const latest = useRef(keys);
  latest.current = keys;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      // Une fenêtre ouverte (sélecteur d'exercice, confirmation) garde ses touches.
      if (document.querySelector("[role=dialog], [role=alertdialog]")) return;
      if (key === "z" && !e.shiftKey) latest.current.undo();
      else if ((key === "z" && e.shiftKey) || key === "y") latest.current.redo();
      else if (key === "s") latest.current.save();
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Annuler / rétablir le dernier pas, avec le raccourci dans l'infobulle. */
function HistoryButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const buttons = [
    {
      label: "Annuler la dernière modification",
      keys: "Ctrl Z",
      icon: Undo2,
      on: onUndo,
      can: canUndo,
    },
    { label: "Rétablir", keys: "Ctrl Y", icon: Redo2, on: onRedo, can: canRedo },
  ];
  return (
    <div className="flex items-center">
      {buttons.map((b) => (
        <Tooltip key={b.keys}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={b.label}
              aria-keyshortcuts={b.keys.replace(" ", "+")}
              disabled={!b.can}
              onClick={b.on}
            >
              <b.icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {b.label} <Kbd>{b.keys}</Kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/**
 * La routine ouverte, toujours modifiable (D243, D250) : le détail EST l'éditeur ; le nom se
 * modifie dans la tête, le dossier et les chiffres dessous. Modifiée (D261), la tête montre
 * l'historique, le nombre de modifications, « Tout annuler » et « Enregistrer » ; les cartes
 * touchées portent « Modifié » ou « Nouveau », les chiffres leur écart.
 */
export function RoutinePane({ routine }: { routine: MockRoutine }) {
  const history = useDraftHistory<Draft>(() => toDraft(routine));
  const { draft, set: setDraft } = history;
  const dirty = isDirty(draft, routine);
  const changes = changeSummary(draft, routine);
  const blocker = saveBlocker(draft);
  const save = () => {
    if (!dirty || blocker) return;
    saveRoutine(fromDraft(draft, routine));
    saved();
  };
  const { guard, release } = useUnsavedGuard(dirty, "cette routine", blocker ? undefined : save);
  useEditorKeys({ undo: history.undo, redo: history.redo, save });

  function discard() {
    // Un pas d'historique comme un autre : « Rétablir » ou Ctrl Z le défait.
    setDraft(toDraft(routine));
    toast("Modifications annulées", {
      id: "routine-annulee",
      action: { label: "Rétablir", onClick: history.undo },
    });
  }

  return (
    <>
      <DetailHeader
        title={<RoutineNameInput draft={draft} onChange={setDraft} />}
        // Sous le nom plutôt qu'entre les boutons : la tête tient aux largeurs moyennes. Ce qui
        // manque se lit à la place du compte, et dit pourquoi Enregistrer est grisé (D252).
        subtitle={
          dirty && (
            <span className="flex items-center gap-1.5 whitespace-nowrap px-2" id="routine-etat">
              {!blocker && <span className="size-1.5 shrink-0 rounded-full bg-foreground" />}
              {blocker ??
                `${plural(changes.count, "modification")} non enregistrée${changes.count > 1 ? "s" : ""}`}
            </span>
          )
        }
        actions={
          <>
            {(history.canUndo || history.canRedo) && (
              <HistoryButtons
                canUndo={history.canUndo}
                canRedo={history.canRedo}
                onUndo={history.undo}
                onRedo={history.redo}
              />
            )}
            {dirty ? (
              <>
                <Button variant="outline" size="sm" onClick={discard}>
                  Tout annuler
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      disabled={blocker !== null}
                      aria-describedby="routine-etat"
                      aria-keyshortcuts="Control+S"
                      onClick={save}
                    >
                      Enregistrer
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <Kbd>Ctrl S</Kbd>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <RoutineMenu routine={routine} release={release} />
            )}
          </>
        }
      />
      <EditorLayout
        main={<RoutineFields draft={draft} onChange={setDraft} changes={changes} />}
        aside={
          <RoutineOverview
            routine={fromDraft(draft, routine)}
            saved={dirty ? routine : undefined}
            draft={draft}
            onChange={setDraft}
          />
        }
      />
      {guard}
    </>
  );
}

/**
 * Création (D238) : le même éditeur, vide, le curseur dans le nom. Rien n'est créé avant
 * *Créer* : il faut un nom et au moins un exercice.
 */
export function RoutinePaneNew() {
  const navigate = useNavigate();
  // « Nouvelle routine ici » : la routine naît dans ce dossier ; on l'oublie une fois lu.
  const [draft, setDraft] = useState<Draft>(() => {
    const empty = toDraft(undefined);
    return { ...empty, folder: peekNextRoutineFolder() ?? empty.folder };
  });
  useEffect(() => () => setNextRoutineFolder(null), []);
  const base = { id: "nouvelle", lastDone: null };
  const { guard, release } = useUnsavedGuard(isDirty(draft, undefined), "cette routine");
  useEffect(() => setDraftName(draft.name), [draft.name]);
  useEffect(() => () => setDraftName(""), []);

  function create() {
    const routine = fromDraft(draft, { id: newRoutineId(), lastDone: null });
    saveRoutine(routine);
    release();
    navigate({ to: "/routines/$id", params: { id: routine.id }, search: true });
    toast.success(`« ${routine.name} » créée`);
  }

  return (
    <>
      <DetailHeader
        title={<RoutineNameInput draft={draft} onChange={setDraft} autoFocus />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/routines", search: true })}
            >
              Annuler
            </Button>
            {saveBlocker(draft) && (
              <span className="text-muted-foreground text-sm" id="routine-manque">
                {saveBlocker(draft)}
              </span>
            )}
            <Button
              size="sm"
              disabled={saveBlocker(draft) !== null}
              aria-describedby="routine-manque"
              onClick={create}
            >
              Créer
            </Button>
          </>
        }
      />
      <EditorLayout
        main={<RoutineFields draft={draft} onChange={setDraft} />}
        aside={
          <RoutineOverview routine={fromDraft(draft, base)} draft={draft} onChange={setDraft} />
        }
      />
      {guard}
    </>
  );
}
