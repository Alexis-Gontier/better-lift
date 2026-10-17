import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { deleteRoutine, newRoutineId, saveRoutine, setDraftName } from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
import { RoutineFigures } from "./routine-detail";
import { canSave, type Draft, fromDraft, isDirty, toDraft } from "./routine-draft";
import { RoutineFields, RoutineMeta, RoutineNameInput } from "./routine-editor";

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
 * La routine ouverte, toujours modifiable (D243, D250) : le détail EST l'éditeur ; le nom se
 * modifie dans la tête, le dossier et les chiffres dessous. Annuler / Enregistrer prennent la
 * place du menu dès que la copie diffère de la routine enregistrée.
 */
export function RoutinePane({ routine }: { routine: MockRoutine }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(routine));
  const dirty = isDirty(draft, routine);
  const { guard, release } = useUnsavedGuard(dirty, "cette routine");

  return (
    <>
      <DetailHeader
        title={<RoutineNameInput draft={draft} onChange={setDraft} />}
        subtitle={
          <RoutineMeta
            draft={draft}
            onChange={setDraft}
            figures={<RoutineFigures routine={fromDraft(draft, routine)} />}
          />
        }
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
      <RoutineFields draft={draft} onChange={setDraft} />
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
        subtitle={
          <RoutineMeta
            draft={draft}
            onChange={setDraft}
            figures={
              <RoutineFigures routine={fromDraft(draft, { id: "nouvelle", lastDone: null })} />
            }
          />
        }
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
      <RoutineFields draft={draft} onChange={setDraft} />
      {guard}
    </>
  );
}
