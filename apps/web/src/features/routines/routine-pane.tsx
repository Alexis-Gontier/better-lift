import { useBlocker, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { InlineField } from "@/components/inline-field";
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
import { deleteRoutine, newRoutineId, saveRoutine } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { RoutineDetail } from "./routine-detail";
import { canSave, type Draft, fromDraft, isDirty, toDraft } from "./routine-draft";
import { RoutineFields } from "./routine-editor";

/**
 * Quitter une routine modifiée et non enregistrée demande confirmation. `release` lève le
 * garde avant une navigation voulue (après suppression, par exemple).
 */
function useUnsavedGuard(dirty: boolean): { guard: ReactNode; release: () => void } {
  const blocking = useRef(dirty);
  blocking.current = dirty;
  const blocker = useBlocker({
    shouldBlockFn: () => blocking.current,
    enableBeforeUnload: () => blocking.current,
    withResolver: true,
  });
  const guard = (
    <AlertDialog open={blocker.status === "blocked"}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitter sans enregistrer ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les modifications de cette routine seront perdues.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>Rester</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
            Quitter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return {
    guard,
    release: () => {
      blocking.current = false;
    },
  };
}

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

const saved = () => toast.success("Routine enregistrée", { id: "routine-enregistree" });

/**
 * A — toujours modifiable (D239) : le détail EST l'éditeur, en champs nus. Annuler / Enregistrer
 * prennent la place du menu dès que la copie diffère de la routine enregistrée.
 */
export function RoutinePaneAlwaysEditable({ routine }: { routine: MockRoutine }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(routine));
  const dirty = isDirty(draft, routine);
  const { guard, release } = useUnsavedGuard(dirty);

  return (
    <>
      <DetailHeader
        title={draft.name.trim() || "Sans nom"}
        subtitle={draft.folder}
        actions={
          dirty ? (
            <>
              <span className="text-muted-foreground text-sm">Non enregistrée</span>
              <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(routine))}>
                Annuler
              </Button>
              <Button
                size="sm"
                disabled={!canSave(draft)}
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
      <RoutineFields draft={draft} onChange={setDraft} bare />
      {guard}
    </>
  );
}

/** B — lecture, puis *Modifier* bascule le panneau sur place (D239). */
export function RoutinePaneReadThenEdit({ routine }: { routine: MockRoutine }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const dirty = draft !== null && isDirty(draft, routine);
  const { guard, release } = useUnsavedGuard(dirty);

  if (!draft)
    return (
      <>
        <DetailHeader
          title={routine.name}
          subtitle={routine.folder}
          actions={
            <>
              <RoutineMenu routine={routine} release={release} />
              <Button size="sm" onClick={() => setDraft(toDraft(routine))}>
                Modifier
              </Button>
            </>
          }
        />
        <RoutineDetail routine={routine} />
      </>
    );

  return (
    <>
      <DetailHeader
        title={draft.name.trim() || "Sans nom"}
        subtitle="Modification"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={!canSave(draft)}
              onClick={() => {
                if (dirty) {
                  saveRoutine(fromDraft(draft, routine));
                  saved();
                }
                setDraft(null);
              }}
            >
              Terminer
            </Button>
          </>
        }
      />
      <RoutineFields draft={draft} onChange={(update) => setDraft((d) => d && update(d))} />
      {guard}
    </>
  );
}

/**
 * C — champ par champ (D239) : chaque valeur se modifie au clic et s'enregistre en la quittant ;
 * le toast propose d'annuler la dernière retouche.
 */
export function RoutinePaneInline({ routine }: { routine: MockRoutine }) {
  const commit = (next: MockRoutine) => {
    saveRoutine(next);
    toast.success("Enregistré", {
      id: "routine-enregistree",
      action: { label: "Annuler", onClick: () => saveRoutine(routine) },
    });
  };
  return (
    <>
      <DetailHeader
        title={
          <InlineField
            label="Nom de la routine"
            value={routine.name}
            inputClassName="h-9 font-medium md:text-xl"
            onCommit={(name) => name.trim() && commit({ ...routine, name: name.trim() })}
          />
        }
        subtitle={routine.folder}
        actions={<RoutineMenu routine={routine} />}
      />
      <RoutineDetail routine={routine} onChange={commit} />
    </>
  );
}

/**
 * Création (D238) : un formulaire dans le panneau, quelle que soit la variante — il n'y a rien
 * à enregistrer champ par champ tant que la routine n'a ni nom ni exercice.
 */
export function RoutinePaneNew({ bare }: { bare: boolean }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => toDraft(undefined));
  const { guard, release } = useUnsavedGuard(isDirty(draft, undefined));

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
        title={draft.name.trim() || "Nouvelle routine"}
        subtitle={draft.folder}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/routines", search: true })}
            >
              Annuler
            </Button>
            <Button size="sm" disabled={!canSave(draft)} onClick={create}>
              Créer
            </Button>
          </>
        }
      />
      <RoutineFields draft={draft} onChange={setDraft} bare={bare} autoFocusName />
      {guard}
    </>
  );
}
