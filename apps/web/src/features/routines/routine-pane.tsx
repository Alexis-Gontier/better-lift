import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { deleteRoutine, newRoutineId, saveRoutine, setDraftName } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { type Draft, fromDraft, isDirty, saveBlocker, toDraft } from "./routine-draft";
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
  return (
    // Le bloc porte la hauteur : le groupe impose `height: 100%` en style en ligne.
    <div className="-mx-6 -mt-6 -mb-6 min-h-0 flex-1">
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={layout.defaultLayout}
        onLayoutChanged={layout.onLayoutChanged}
      >
        {/* 560 px : le tableau des séries a des colonnes fixes ; en dessous, il serait coupé. */}
        <ResizablePanel id="exercices" defaultSize="70%" minSize="560px">
          <ScrollArea className={scrollBlock}>
            <div className="flex min-w-0 flex-col gap-3 px-6 pt-6 pb-24 *:shrink-0">{main}</div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="apercu" defaultSize="30%" minSize="220px" maxSize="50%">
          <ScrollArea className={scrollBlock}>
            <aside className="@container flex flex-col gap-4 px-6 pt-6 pb-24 *:shrink-0">
              {aside}
            </aside>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

const saved = () => toast.success("Routine enregistrée", { id: "routine-enregistree" });

/**
 * La routine ouverte, toujours modifiable (D243, D250) : le détail EST l'éditeur ; le nom se
 * modifie dans la tête, le dossier et les chiffres dessous. Annuler / Enregistrer prennent la
 * place du menu dès que la copie diffère de la routine enregistrée.
 */
export function RoutinePane({ routine }: { routine: MockRoutine }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(routine));
  const dirty = isDirty(draft, routine);
  const base = routine;
  const { guard, release } = useUnsavedGuard(dirty, "cette routine");

  return (
    <>
      <DetailHeader
        title={<RoutineNameInput draft={draft} onChange={setDraft} />}
        actions={
          dirty ? (
            <>
              {/* Ce qui manque se lit à la place de l'état : le bouton grisé dit pourquoi (D252). */}
              <span className="text-muted-foreground text-sm" id="routine-etat">
                {saveBlocker(draft) ?? "Non enregistrée"}
              </span>
              <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(routine))}>
                Annuler
              </Button>
              <Button
                size="sm"
                disabled={saveBlocker(draft) !== null}
                aria-describedby="routine-etat"
                onClick={() => {
                  saveRoutine(fromDraft(draft, routine));
                  saved();
                }}
              >
                Enregistrer
              </Button>
            </>
          ) : (
            <RoutineMenu routine={routine} release={release} />
          )
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

/**
 * Création (D238) : le même éditeur, vide, le curseur dans le nom. Rien n'est créé avant
 * *Créer* : il faut un nom et au moins un exercice.
 */
export function RoutinePaneNew() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => toDraft(undefined));
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
