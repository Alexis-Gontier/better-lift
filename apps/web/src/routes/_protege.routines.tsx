import type { RoutineDetail } from "@better-lift/shared";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { champEtat, estVideForce, etatForceRendu } from "@/components/etats/etat-force";
import { AppShell } from "@/components/shell/app-shell";
import { DetailRoutine } from "@/features/routines/detail-routine";
import { EditeurRoutine, type RoutineEnregistree } from "@/features/routines/editeur-routine";
import { ListeRoutines } from "@/features/routines/liste-routines";
import { ROUTINES, resumer } from "@/mocks/routines";

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

  // DESSIN (D54, PR 1) : les routines factices vivent dans un état local, pour
  // que créer, modifier, réordonner et supprimer soient ÉPROUVABLES avant toute
  // API. Le branchement remplacera cet état par des requêtes, sans toucher aux
  // composants.
  const [routines, setRoutines] = useState<RoutineDetail[]>(ROUTINES);

  const visibles = estVideForce(etat) ? [] : routines;
  const selectionnee = id && id !== NOUVELLE ? visibles.find((r) => r.id === id) : undefined;
  const aller = (s: { id?: string; edition?: "1" }) =>
    navigate({ search: (prec) => ({ ...prec, id: s.id, edition: s.edition }) });

  const enregistrer = (r: RoutineEnregistree) => {
    if (id === NOUVELLE) {
      const nouvelId = `r${Date.now()}`;
      setRoutines((rs) => [...rs, { id: nouvelId, ...r }]);
      aller({ id: nouvelId });
    } else if (selectionnee) {
      setRoutines((rs) => rs.map((x) => (x.id === selectionnee.id ? { ...x, ...r } : x)));
      aller({ id: selectionnee.id });
    }
  };

  function panneauDetail() {
    if (edition && id === NOUVELLE) {
      return (
        <EditeurRoutine
          key={NOUVELLE}
          initiale={null}
          enregistrement={false}
          onEnregistrer={enregistrer}
          onAnnuler={() => aller({})}
        />
      );
    }
    if (!selectionnee) return undefined;
    if (edition) {
      return (
        <EditeurRoutine
          // La clé remonte l'éditeur quand on change de routine : sa copie de
          // travail repart de la bonne version.
          key={selectionnee.id}
          initiale={selectionnee}
          enregistrement={false}
          onEnregistrer={enregistrer}
          onAnnuler={() => aller({ id: selectionnee.id })}
          onSupprimer={() => {
            setRoutines((rs) => rs.filter((x) => x.id !== selectionnee.id));
            aller({});
          }}
        />
      );
    }
    return (
      <DetailRoutine
        routine={selectionnee}
        onModifier={() => aller({ id: selectionnee.id, edition: "1" })}
        onFermer={() => aller({})}
      />
    );
  }

  return (
    <AppShell
      liste={
        etatForceRendu(etat, "Les routines n'ont pas pu être chargées.", () =>
          navigate({ search: (s) => ({ ...s, etat: undefined }) }),
        ) ?? (
          <ListeRoutines
            routines={visibles.map(resumer)}
            idSelectionne={id}
            onSelection={(rId) => aller({ id: rId })}
            onCreer={() => aller({ id: NOUVELLE, edition: "1" })}
          />
        )
      }
      detail={panneauDetail()}
    />
  );
}
