import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { formatDay } from "@/lib/format";
import type { SessionDetail } from "@/mocks/history";
import { mockRoutines } from "@/mocks/routines";
import { saveSession } from "@/mocks/session-store";
import { SessionDetailView } from "./session-detail";

type Props = { detail: SessionDetail; previous?: SessionDetail };

/** Sans API, supprimer referme simplement la séance. */
function DeleteButton({ release }: { release?: () => void }) {
  const navigate = useNavigate();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Supprimer
        </Button>
      </AlertDialogTrigger>
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
              release?.();
              navigate({ to: "/history", search: true });
            }}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Les actions de lecture : la routine d'origine, puis Supprimer. */
function ReadActions({ detail, release }: { detail: SessionDetail; release?: () => void }) {
  const routine = mockRoutines.find((r) => r.name === detail.session.routine);
  return (
    <>
      {routine && (
        <Button variant="outline" size="sm" asChild>
          <Link to="/routines/$id" params={{ id: routine.id }}>
            Voir la routine
          </Link>
        </Button>
      )}
      <DeleteButton release={release} />
    </>
  );
}

const fingerprint = (d: SessionDetail) =>
  JSON.stringify({ minutes: d.session.minutes, notes: d.notes ?? "", exercises: d.exercises });

const saved = () => toast.success("Séance corrigée", { id: "seance-corrigee" });

/** A — toujours modifiable (D239) : champs nus ; Annuler / Enregistrer dès qu'il y a un écart. */
export function SessionPaneAlwaysEditable({ detail, previous }: Props) {
  const [draft, setDraft] = useState(detail);
  const dirty = fingerprint(draft) !== fingerprint(detail);
  const { guard, release } = useUnsavedGuard(dirty, "cette séance");
  return (
    <>
      <DetailHeader
        title={detail.session.routine}
        subtitle={formatDay(detail.session.date)}
        actions={
          dirty ? (
            <>
              <span className="text-muted-foreground text-sm">Non enregistrée</span>
              <Button variant="outline" size="sm" onClick={() => setDraft(detail)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  saveSession(draft);
                  saved();
                }}
              >
                Enregistrer
              </Button>
            </>
          ) : (
            <ReadActions detail={detail} release={release} />
          )
        }
      />
      <SessionDetailView
        detail={draft}
        previous={previous}
        edit={{ mode: "bare", onChange: setDraft }}
      />
      {guard}
    </>
  );
}

/** B — lecture, puis *Corriger* bascule le panneau sur place (D239). */
export function SessionPaneReadThenEdit({ detail, previous }: Props) {
  const [draft, setDraft] = useState<SessionDetail | null>(null);
  const dirty = draft !== null && fingerprint(draft) !== fingerprint(detail);
  const { guard, release } = useUnsavedGuard(dirty, "cette séance");
  return (
    <>
      <DetailHeader
        title={detail.session.routine}
        subtitle={draft ? "Correction" : formatDay(detail.session.date)}
        actions={
          draft ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (dirty) {
                    saveSession(draft);
                    saved();
                  }
                  setDraft(null);
                }}
              >
                Terminer
              </Button>
            </>
          ) : (
            <>
              <ReadActions detail={detail} release={release} />
              <Button size="sm" onClick={() => setDraft(detail)}>
                Corriger
              </Button>
            </>
          )
        }
      />
      <SessionDetailView
        detail={draft ?? detail}
        previous={previous}
        edit={draft ? { mode: "field", onChange: setDraft } : undefined}
      />
      {guard}
    </>
  );
}

/** C — champ par champ (D239) : un clic sur une valeur, enregistrée en la quittant. */
export function SessionPaneInline({ detail, previous }: Props) {
  const commit = (next: SessionDetail) => {
    saveSession(next);
    toast.success("Enregistré", {
      id: "seance-corrigee",
      action: { label: "Annuler", onClick: () => saveSession(detail) },
    });
  };
  return (
    <>
      <DetailHeader
        title={detail.session.routine}
        subtitle={formatDay(detail.session.date)}
        actions={<ReadActions detail={detail} />}
      />
      <SessionDetailView
        detail={detail}
        previous={previous}
        edit={{ mode: "inline", onChange: commit }}
      />
    </>
  );
}
