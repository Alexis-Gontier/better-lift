import { createFileRoute } from "@tanstack/react-router";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/settings/data")({
  staticData: { crumb: "Données" },
  component: () => (
    <>
      <Zone
        title="Importer depuis Hevy"
        hint="Fichier CSV → correspondance des exercices → aperçu → import"
        className="min-h-28"
      />
      <Zone title="Exporter" hint="CSV ou JSON" className="min-h-28" />
      <Zone title="Supprimer les données" hint="Séances, routines, pesées" className="min-h-28" />
    </>
  ),
});
