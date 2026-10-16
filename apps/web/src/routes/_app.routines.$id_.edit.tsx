import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/routines/$id_/edit")({
  staticData: { crumb: "Modifier" },
  component: EditorPage,
});

function EditorPage() {
  return (
    <Page
      title="Modifier la routine"
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/routines">Annuler</Link>
          </Button>
          <Button>Enregistrer</Button>
        </>
      }
    >
      <Zone title="Nom et dossier" hint="Nom de la routine, dossier, notes" className="min-h-20" />
      <Zone
        title="Exercices"
        hint="Réordonnables au glisser-déposer ; séries, repos, supersets"
        className="h-96"
      />
      <Zone title="Ajouter un exercice" hint="Recherche dans le catalogue" className="min-h-14" />
    </Page>
  );
}
