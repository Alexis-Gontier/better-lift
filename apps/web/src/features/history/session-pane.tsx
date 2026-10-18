import { useNavigate, useParams } from "@tanstack/react-router";
import { ListChecks, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { formatDay } from "@/lib/format";
import type { SessionDetail } from "@/mocks/history";
import { useRoutines } from "@/mocks/routine-store";
import { deleteSession, saveSession } from "@/mocks/session-store";
import type { MockSession } from "@/mocks/sessions";
import { changedExercises, sessionChangeCount } from "./session-draft";
import { SessionExercises, SessionNote, SessionSummary } from "./session-editor";

/**
 * Supprimer une séance, après confirmation : du menu ⋯ comme du clic droit dans la liste. Ouverte,
 * elle se referme. Le toast permet d'annuler.
 */
export function DeleteSessionDialog({
  session,
  onOpenChange,
  release,
}: {
  /** La séance à supprimer ; `null` : fenêtre fermée. */
  session: MockSession | null;
  onOpenChange: (open: boolean) => void;
  /** Lève le garde « non enregistré » de la séance ouverte avant de la quitter. */
  release?: () => void;
}) {
  const navigate = useNavigate();
  const { id: openId } = useParams({ strict: false });
  function remove() {
    if (!session) return;
    const undo = deleteSession(session.id);
    if (session.id === openId) {
      release?.();
      navigate({ to: "/history", search: true });
    }
    toast("Séance supprimée", { action: { label: "Annuler", onClick: undo } });
  }
  return (
    <AlertDialog open={session !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
          <AlertDialogDescription>
            {session && `${session.routine}, ${formatDay(session.date)}. `}Ses séries et les records
            qu'elle portait disparaîtront.
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
  );
}

/** Le menu ⋯ de la séance : la routine d'origine, puis Supprimer. */
function SessionMenu({ detail, release }: { detail: SessionDetail; release: () => void }) {
  const navigate = useNavigate();
  const routine = useRoutines().find((r) => r.name === detail.session.routine);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label="Actions de la séance">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {routine && (
            <DropdownMenuItem
              onSelect={() => navigate({ to: "/routines/$id", params: { id: routine.id } })}
            >
              <ListChecks /> Voir la routine
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteSessionDialog
        session={confirming ? detail.session : null}
        onOpenChange={setConfirming}
        release={release}
      />
    </>
  );
}

/**
 * La séance ouverte, toujours corrigeable comme une routine (D263, tranche D239 pour A) : ses
 * chiffres en bandeau, ses exercices, sa note, sur toute la largeur (D265) ; modifiée, la tête
 * montre l'historique, le compte, « Tout annuler » et « Enregistrer ».
 */
export function SessionPane({
  detail,
  previous,
}: {
  detail: SessionDetail;
  previous?: SessionDetail;
}) {
  const edit = useEditable<SessionDetail>({
    initial: () => detail,
    isDirty: (d) => sessionChangeCount(d, detail) > 0,
    count: (d) => sessionChangeCount(d, detail),
    onSave: saveSession,
    what: "cette séance",
    savedMessage: "Séance corrigée",
  });
  const { draft, setDraft } = edit;
  return (
    <>
      <DetailHeader
        title={detail.session.routine}
        subtitle={formatDay(detail.session.date)}
        actions={edit.actions(<SessionMenu detail={detail} release={edit.release} />)}
      />
      <SessionSummary draft={draft} previous={previous} onChange={setDraft} />
      <div className="flex flex-col gap-3">
        <SessionExercises
          draft={draft}
          previous={previous}
          changed={changedExercises(draft, detail)}
          onChange={setDraft}
        />
      </div>
      <SessionNote draft={draft} onChange={setDraft} />
      {edit.guard}
    </>
  );
}
