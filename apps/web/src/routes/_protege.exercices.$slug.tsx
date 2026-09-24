import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { DetailExercice } from "@/features/exercices/detail-exercice";
import { optionsExercice } from "@/features/exercices/requetes";
import { optionsRecords } from "@/features/seances/requetes";

/**
 * La fiche d'un exercice, dans le panneau de détail (D81). Le slug est
 * l'identifiant stable et lisible du catalogue : `/exercices/barbell-bench-press`.
 */
export const Route = createFileRoute("/_protege/exercices/$slug")({ component: PageExercice });

function PageExercice() {
  const { slug } = Route.useParams();
  const navigate = Route.useNavigate();
  const detail = useQuery(optionsExercice(slug));
  const records = useQuery(optionsRecords(slug));

  if (detail.isPending) return <EtatChargement />;
  if (detail.isError) {
    return (
      <EtatErreur
        message="Cet exercice n'a pas pu être chargé."
        onReessayer={() => detail.refetch()}
      />
    );
  }
  return (
    <DetailExercice
      records={records.isError ? null : records.data}
      exercice={detail.data}
      // Fermer garde les filtres : on retombe sur la liste telle qu'on l'a laissée.
      onFermer={() => navigate({ to: "/exercices", search: (s) => s })}
    />
  );
}
