import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  component: HomePage,
});

function HomePage() {
  return (
    <Page title="Accueil">
      <Zone title="Aujourd'hui" hint="Routine planifiée du jour, ou « Repos », ou Planifier" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Zone title="Séances" hint="Cette semaine, écart avec la précédente" />
        <Zone title="Volume" hint="Cette semaine, écart avec la précédente" />
        <Zone title="Durée" hint="Cette semaine, écart avec la précédente" />
        <Zone title="Jours d'affilée" hint="Régularité en cours" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Zone
          title="Volume par semaine"
          hint="Barres, 12 semaines"
          className="h-64 md:col-span-2"
        />
        <Zone
          title="Poids"
          hint="Valeur actuelle, tendance 7 jours, mini-courbe"
          className="h-64"
        />
        <Zone title="Régularité" hint="Calendrier de l'année" className="h-40 md:col-span-3" />
        <Zone title="Objectifs" hint="Barres d'avancement" className="h-48" />
        <Zone title="Records récents" hint="30 derniers jours" className="h-48" />
        <Zone title="Dernières séances" hint="Les 5 dernières" className="h-48" />
      </div>
    </Page>
  );
}
