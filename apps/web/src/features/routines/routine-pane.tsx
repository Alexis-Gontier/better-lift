import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DetailColumns } from "@/components/detail-columns";
import { useEditable } from "@/components/editable";
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
import {
  deleteRoutine,
  newRoutineId,
  peekNextRoutineFolder,
  saveRoutine,
  setDraftName,
  setNextRoutineFolder,
} from "@/mocks/routine-store";
import type { MockRoutine } from "@/mocks/routines";
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

/**
 * La routine ouverte, toujours modifiable (D243, D250) : le détail EST l'éditeur ; le nom se
 * modifie dans la tête, le dossier et les chiffres dessous. Modifiée (D261), la tête montre
 * l'historique, le nombre de modifications, « Tout annuler » et « Enregistrer » ; les cartes
 * touchées portent « Modifié » ou « Nouveau », les chiffres leur écart.
 */
export function RoutinePane({ routine }: { routine: MockRoutine }) {
  const edit = useEditable<Draft>({
    initial: () => toDraft(routine),
    isDirty: (d) => isDirty(d, routine),
    count: (d) => changeSummary(d, routine).count,
    blocker: saveBlocker,
    onSave: (d) => saveRoutine(fromDraft(d, routine)),
    what: "cette routine",
    savedMessage: "Routine enregistrée",
  });
  const { draft, setDraft } = edit;

  return (
    <>
      <DetailHeader
        title={<RoutineNameInput draft={draft} onChange={setDraft} />}
        // La ligne d'état garde sa hauteur, vide ou non : la fiche ne saute pas à la première
        // modification.
        subtitle={<span className="flex h-5 items-center">{edit.status}</span>}
        actions={edit.actions(<RoutineMenu routine={routine} release={edit.release} />)}
      />
      <DetailColumns
        id="routine-editeur"
        main={
          <RoutineFields
            draft={draft}
            onChange={setDraft}
            changes={changeSummary(draft, routine)}
          />
        }
        aside={
          <RoutineOverview
            routine={fromDraft(draft, routine)}
            saved={edit.dirty ? routine : undefined}
            draft={draft}
            onChange={setDraft}
          />
        }
      />
      {edit.guard}
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
      <DetailColumns
        id="routine-editeur"
        main={<RoutineFields draft={draft} onChange={setDraft} />}
        aside={
          <RoutineOverview routine={fromDraft(draft, base)} draft={draft} onChange={setDraft} />
        }
      />
      {guard}
    </>
  );
}
