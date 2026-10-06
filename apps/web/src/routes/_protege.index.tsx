import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { champEtat, etatForceRendu } from "@/components/etats/etat-force";
import { EtatVide } from "@/components/etats/etat-vide";
import { PageTableau } from "@/components/shell/page-tableau";

const recherche = z.object({ etat: champEtat });

// La page d'arrivée (D134), sous la garde de `_protege` : l'ancien `/` du lot 0
// était public. Ses stats arrivent au lot 2.
export const Route = createFileRoute("/_protege/")({
  validateSearch: recherche,
  component: TableauDeBord,
});

function TableauDeBord() {
  const { etat } = Route.useSearch();
  const navigate = Route.useNavigate();
  const force = etatForceRendu(etat, "Les statistiques n'ont pas pu être chargées.", () =>
    navigate({ search: (s) => ({ ...s, etat: undefined }) }),
  );

  return (
    <PageTableau titre="Tableau de bord">
      {force ?? (
        <div className="h-80">
          <EtatVide
            titre="Bientôt ici : tes statistiques."
            message="Séances, régularité, muscles travaillés et records, par période."
          />
        </div>
      )}
    </PageTableau>
  );
}
