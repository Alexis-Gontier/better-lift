import { LIBELLE_GROUPE } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { DetailColumns, DetailColumnsSkeleton } from "@/components/detail-columns";
import { DetailEmpty, DetailHeader } from "@/components/list-detail";
import { useCrumbLabel } from "@/components/shell/crumb-label";
import { etatAffiche } from "@/components/states/etat";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import { ErreurApi } from "@/lib/api";
import { exerciceQuery, historiqueQuery } from "@/lib/exercices";
import { ExerciseFigures, ExerciseLook, ExerciseMain } from "./exercise-detail";

/**
 * La fiche d'un exercice, en lecture seule (D264, D294) : sa progression à gauche, ses records,
 * son animation et ses muscles à droite. `?etat=vide` montre un exercice jamais fait.
 */
export function ExerciseFiche({ slug }: { slug: string }) {
  const force = useEtat();
  const exercice = useQuery(exerciceQuery(slug));
  const historique = useQuery(historiqueQuery(slug));
  useCrumbLabel(exercice.data?.nom);

  if (exercice.error instanceof ErreurApi && exercice.error.statut === 404)
    return (
      <DetailEmpty
        title="Cet exercice n'existe pas"
        description="Il a peut-être été retiré du catalogue."
      />
    );
  const etat = etatAffiche(
    force,
    {
      isPending: exercice.isPending || historique.isPending,
      isError: exercice.isError || historique.isError,
    },
    false,
  );
  if (etat === "chargement" || !exercice.data) return <DetailColumnsSkeleton />;
  if (etat === "erreur")
    return (
      <StateError
        title="L'exercice n'a pas pu se charger"
        reessayer={() => {
          void exercice.refetch();
          void historique.refetch();
        }}
      />
    );

  const e = exercice.data;
  const seances = etat === "vide" ? [] : (historique.data ?? []);
  return (
    <>
      <DetailHeader title={e.nom} subtitle={`${LIBELLE_GROUPE[e.groupe]} · ${e.equipement}`} />
      <DetailColumns
        id="exercice-fiche"
        main={
          seances.length === 0 ? (
            <DetailEmpty
              title="Pas encore fait"
              description={`Ajoutez ${e.nom} à une routine : sa progression apparaîtra ici après la première séance.`}
            />
          ) : (
            <ExerciseMain history={seances} />
          )
        }
        aside={
          <>
            {seances.length > 0 && <ExerciseFigures history={seances} />}
            <ExerciseLook exercise={e} />
          </>
        }
      />
    </>
  );
}
