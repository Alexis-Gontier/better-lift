import { useNavigate } from "@tanstack/react-router";
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
import { saveSession } from "@/mocks/session-store";
import { changedExercises, sessionChangeCount } from "./session-draft";
import { SessionExercises, SessionNote, SessionSummary } from "./session-editor";

/** Le menu ⋯ de la séance : la routine d'origine, puis Supprimer. Sans API, supprimer la referme. */
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
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ses séries et les records qu'elle portait disparaîtront. C'est définitif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                release();
                navigate({ to: "/history", search: true });
                toast("Séance supprimée");
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
