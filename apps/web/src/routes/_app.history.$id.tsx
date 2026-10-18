import { createFileRoute } from "@tanstack/react-router";
import { DetailColumnsSkeleton } from "@/components/detail-columns";
import { DetailEmpty } from "@/components/list-detail";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { SessionPane } from "@/features/history/session-pane";
import { previousOf } from "@/mocks/history";
import { detailOf, useSessions } from "@/mocks/session-store";

export const Route = createFileRoute("/_app/history/$id")({
  staticData: { crumb: "Détail" },
  component: SessionRoute,
});

/** La séance ouverte, dans le panneau de droite (D235), corrigée là où on la lit (D263). */
function SessionRoute() {
  const { id } = Route.useParams();
  const { state } = useProto();
  const sessions = useSessions();
  const session = sessions.find((s) => s.id === id);

  if (state === "chargement") return <DetailColumnsSkeleton />;
  if (state === "erreur") return <StateError title="La séance n'a pas pu se charger" />;
  if (!session || state === "vide")
    return (
      <DetailEmpty
        title="Cette séance n'existe pas"
        description="Elle a peut-être été supprimée."
      />
    );

  const before = previousOf(sessions, id);
  // `key` : d'une séance à l'autre, le brouillon repart de zéro.
  return (
    <SessionPane
      key={id}
      detail={detailOf(session)}
      previous={before ? detailOf(before) : undefined}
    />
  );
}
