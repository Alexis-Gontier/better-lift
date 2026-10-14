import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { EditeurRoutine } from "@/features/routines/editeur-routine";
import {
  optionsRoutine,
  useRemplacerRoutine,
  useSupprimerRoutine,
} from "@/features/routines/requetes";

/** Une routine enregistrée, ouverte et toujours modifiable (D81). */
export const Route = createFileRoute("/_authenticated/routines/$id")({ component: PageRoutine });

function PageRoutine() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const detail = useQuery(optionsRoutine(id));
  const remplacer = useRemplacerRoutine(id);
  const supprimer = useSupprimerRoutine();
  const fermer = () => navigate({ to: "/routines" });

  if (detail.isPending) return <EtatChargement lignes={6} />;
  if (detail.isError) {
    return (
      <EtatErreur
        message="Cette routine n'a pas pu être chargée."
        onReessayer={() => detail.refetch()}
      />
    );
  }
  const routine = detail.data;
  return (
    <EditeurRoutine
      // La clé remonte l'éditeur quand on change de routine : sa copie de
      // travail repart de la bonne version.
      key={routine.id}
      initiale={routine}
      enregistrement={remplacer.isPending || supprimer.isPending}
      erreur={remplacer.error?.message ?? supprimer.error?.message}
      onEnregistrer={(r) => remplacer.mutate(r)}
      onFermer={fermer}
      onSupprimer={() => supprimer.mutate(routine.id, { onSuccess: fermer })}
    />
  );
}
