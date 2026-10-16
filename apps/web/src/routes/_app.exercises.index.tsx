import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { PageTabs, useTab } from "@/components/page-tabs";
import { Button } from "@/components/ui/button";
import { Zone } from "@/components/zone";

export const Route = createFileRoute("/_app/exercises/")({
  component: ExercisesPage,
});

const TABS = [
  { value: "catalogue", label: "Catalogue" },
  { value: "mes-exercices", label: "Mes exercices" },
] as const;

const SLUGS = ["squat", "developpe-couche", "souleve-de-terre", "tractions", "rowing", "dips"];

function ExercisesPage() {
  const tab = useTab(TABS.map((t) => t.value));
  return (
    <Page
      title="Exercices"
      tabs={<PageTabs tabs={TABS} />}
      actions={<Button>Exercice personnalisé</Button>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Zone title="Recherche" hint="Nom de l'exercice" className="min-h-12 md:col-span-2" />
        <Zone title="Filtres · Tri" hint="Équipement, dernière fois" className="min-h-12" />
        <Zone
          title="Muscles"
          hint="Pastilles : Pectoraux / Dos / Jambes / Épaules / Bras / …"
          className="min-h-12 md:col-span-3"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {(tab === "catalogue" ? SLUGS : SLUGS.slice(0, 2)).map((slug) => (
          <Link key={slug} to="/exercises/$slug" params={{ slug }} className="contents">
            <Zone
              title={slug}
              hint="Image, nom, muscle principal, dernière fois"
              className="min-h-20 transition-colors hover:bg-muted/50"
            />
          </Link>
        ))}
      </div>
    </Page>
  );
}
