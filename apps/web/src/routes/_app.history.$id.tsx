import { createFileRoute } from "@tanstack/react-router";
import { DetailEmpty, DetailSkeleton } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  SessionPaneAlwaysEditable,
  SessionPaneInline,
  SessionPaneReadThenEdit,
} from "@/features/history/session-pane";
import { previousOf } from "@/mocks/history";
import { detailOf, useSessions } from "@/mocks/session-store";

export const Route = createFileRoute("/_app/history/$id")({
  staticData: { crumb: "Détail" },
  component: SessionPane,
});

/**
 * La séance ouverte, dans le panneau de droite (D235), corrigée là où on la lit : A toujours
 * modifiable, B lecture puis Corriger, C champ par champ (D239).
 */
function SessionPane() {
  const { id } = Route.useParams();
  const { state, variant } = useProto();
  const sessions = useSessions();
  const session = sessions.find((s) => s.id === id);

  if (state === "chargement") return <DetailSkeleton />;
  if (state === "erreur") return <StateError title="La séance n'a pas pu se charger" />;
  if (!session || state === "vide")
    return (
      <DetailEmpty
        title="Cette séance n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );

  const detail = detailOf(session);
  const before = previousOf(sessions, id);
  const previous = before ? detailOf(before) : undefined;
  // `key` : d'une séance à l'autre, le brouillon repart de zéro.
  if (variant === "b")
    return <SessionPaneReadThenEdit key={id} detail={detail} previous={previous} />;
  if (variant === "c") return <SessionPaneInline key={id} detail={detail} previous={previous} />;
  return <SessionPaneAlwaysEditable key={id} detail={detail} previous={previous} />;
}
