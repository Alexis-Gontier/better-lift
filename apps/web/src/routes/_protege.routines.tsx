import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { EtatChargement } from "@/components/etats/etat-chargement";
import { EtatErreur } from "@/components/etats/etat-erreur";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { DetailRoutine } from "@/features/routines/detail-routine";
import { EditeurRoutine } from "@/features/routines/editeur-routine";
import { ListeRoutines } from "@/features/routines/liste-routines";
import {
  optionsRoutine,
  optionsRoutines,
  useCreerRoutine,
  useRemplacerRoutine,
  useSupprimerRoutine,
} from "@/features/routines/requetes";

/** L'identifiant réservé d'une routine pas encore enregistrée. */
const NOUVELLE = "nouvelle";

// Le détail ouvert ET le mode édition vivent dans l'URL (D49) : un rechargement
// retombe dans l'éditeur. `edition` vaut « 1 » ou rien, pour une URL lisible.
const recherche = z.object({
  id: z.string().optional(),
  edition: z.literal("1").optional().catch(undefined),
  etat: champEtat,
});

export const Route = createFileRoute("/_protege/routines")({
  validateSearch: recherche,
  component: PageRoutines,
});

function PageRoutines() {
  const { id, edition, etat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const aller = (s: { id?: string; edition?: "1" }) =>
    navigate({ search: (prec) => ({ ...prec, id: s.id, edition: s.edition }) });

  const existante = id && id !== NOUVELLE ? id : undefined;
  const liste = useQuery(optionsRoutines());
  const detail = useQuery({ ...optionsRoutine(existante ?? ""), enabled: Boolean(existante) });

  const creer = useCreerRoutine();
  const remplacer = useRemplacerRoutine(existante ?? "");
  const supprimer = useSupprimerRoutine();

  function panneauListe() {
    const force = etatForceRendu(etat, "Les routines n'ont pas pu être chargées.", () =>
      navigate({ search: (s) => ({ ...s, etat: undefined }) }),
    );
    if (force) return force;
    if (liste.isPending) return <EtatChargement />;
    if (liste.isError) {
      return (
        <EtatErreur
          message="Les routines n'ont pas pu être chargées."
          onReessayer={() => liste.refetch()}
        />
      );
    }
    return (
      <ListeRoutines
        routines={estVideForce(etat) ? [] : liste.data}
        idSelectionne={id}
        onSelection={(rId) => aller({ id: rId })}
        onCreer={() => aller({ id: NOUVELLE, edition: "1" })}
      />
    );
  }

  function panneauDetail() {
    if (edition && id === NOUVELLE) {
      return (
        <EditeurRoutine
          key={NOUVELLE}
          initiale={null}
          enregistrement={creer.isPending}
          erreur={creer.error?.message}
          onEnregistrer={(r) =>
            creer.mutate(r, { onSuccess: (nouvelId) => aller({ id: nouvelId }) })
          }
          onAnnuler={() => aller({})}
        />
      );
    }
    if (!existante) return undefined;
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
    if (edition) {
      return (
        <EditeurRoutine
          // La clé remonte l'éditeur quand on change de routine : sa copie de
          // travail repart de la bonne version.
          key={routine.id}
          initiale={routine}
          enregistrement={remplacer.isPending || supprimer.isPending}
          erreur={remplacer.error?.message ?? supprimer.error?.message}
          onEnregistrer={(r) => remplacer.mutate(r, { onSuccess: () => aller({ id: routine.id }) })}
          onAnnuler={() => aller({ id: routine.id })}
          onSupprimer={() => supprimer.mutate(routine.id, { onSuccess: () => aller({}) })}
        />
      );
    }
    return (
      <DetailRoutine
        routine={routine}
        onModifier={() => aller({ id: routine.id, edition: "1" })}
        onFermer={() => aller({})}
      />
    );
  }

  return <AppShell liste={panneauListe()} detail={panneauDetail()} />;
}
