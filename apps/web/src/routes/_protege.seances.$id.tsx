import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { DetailSeance } from "@/features/seances/detail-seance";
import { optionsSeance, useSupprimerSeance } from "@/features/seances/requetes";

/** Une séance de l'historique, ouverte dans le panneau de détail (D81). */
export const Route = createFileRoute("/_protege/seances/$id")({ component: PageSeance });

function PageSeance() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const detail = useQuery(optionsSeance(id));
  const supprimer = useSupprimerSeance();

  if (detail.isPending) return <EtatChargement lignes={6} />;
  if (detail.isError) {
    return (
      <EtatErreur
        message="Cette séance n'a pas pu être chargée."
        onReessayer={() => detail.refetch()}
      />
    );
  }
  return (
    <DetailSeance
      seance={detail.data}
      onFermer={() => navigate({ to: "/seances", search: (s) => s })}
      onSupprimer={() =>
        supprimer.mutate(id, { onSuccess: () => navigate({ to: "/seances", search: (s) => s }) })
      }
    />
  );
}
