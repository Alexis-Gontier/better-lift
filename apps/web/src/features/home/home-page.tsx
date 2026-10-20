import {
  type Bornes,
  bornesPeriode,
  chargeMuscles,
  chiffresCles,
  depuisPour,
  LIBELLE_PERIODE,
  PERIODES,
  type Periode,
  recordsRecents,
  semaineEnCours,
  type TableauDeBord,
  tendance,
} from "@better-lift/shared";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { useMemo, useState } from "react";
import { Page } from "@/components/page";
import { etatAffiche } from "@/components/states/etat";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FUSEAU, jourCivil } from "@/lib/locale";
import { HomeSkeleton } from "./home-skeleton";
import { KpiCards } from "./kpi-cards";
import { MusclesCard } from "./muscles-card";
import { periodeRetenue, retenirPeriode } from "./periode";
import { tableauDeBordQuery } from "./queries";
import { RecentRecords, RecentSessions } from "./recent-lists";
import { ThisWeek } from "./this-week";
import { TrendChart } from "./trend-chart";

/** Rang du jour civil d'aujourd'hui, 0 = lundi. */
const rangDuJour = (maintenant: Date) => (new Date(jourCivil(maintenant)).getUTCDay() + 6) % 7;

/**
 * L'Accueil (D330) : un tableau de bord, bilan d'abord — chiffres clés de la période, semaine en
 * cours, tendance, muscles, puis records et séances récents. La période est le dernier choix
 * de ce navigateur.
 */
export function HomePage() {
  const [periode, setPeriode] = useState(periodeRetenue);
  const force = useEtat();
  // Les bornes ne bougent qu'avec la période : la clé de la requête reste stable entre deux rendus.
  const bornes = useMemo(() => bornesPeriode(periode, new Date(), FUSEAU), [periode]);
  // Changer de période garde l'ancien tableau à l'écran le temps de la lecture, sans squelette.
  const requete = useQuery({
    ...tableauDeBordQuery(depuisPour(bornes)),
    placeholderData: keepPreviousData,
  });
  const donnees = requete.data;
  const etat = etatAffiche(force, requete, donnees?.total === 0);

  const choixPeriode = (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={periode}
      onValueChange={(v) => {
        if (!v) return;
        setPeriode(v as Periode);
        retenirPeriode(v as Periode);
      }}
      aria-label="Période"
    >
      {PERIODES.map((p) => (
        <ToggleGroupItem key={p} value={p}>
          {LIBELLE_PERIODE[p]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  return (
    <Page
      title="Accueil"
      // Visible dès le chargement : la page ne saute pas quand les données arrivent.
      actions={etat === "nominal" || etat === "chargement" ? choixPeriode : undefined}
    >
      {etat === "chargement" ? (
        <HomeSkeleton />
      ) : etat === "erreur" ? (
        <StateError
          title="L'accueil n'a pas pu se charger"
          reessayer={() => void requete.refetch()}
        />
      ) : etat === "vide" ? (
        <HomeEmpty />
      ) : donnees ? (
        <Tableau donnees={donnees} bornes={bornes} />
      ) : (
        // `?etat=nominal` forcé avant l'arrivée des données : le squelette, pas un écran vide.
        <HomeSkeleton />
      )}
    </Page>
  );
}

function Tableau({ donnees, bornes }: { donnees: TableauDeBord; bornes: Bornes }) {
  const maintenant = new Date();
  const { seances } = donnees;
  const semaine = semaineEnCours(seances, maintenant, FUSEAU);
  return (
    <div className="flex flex-col gap-4">
      <ThisWeek
        jours={semaine.jours}
        seances={semaine.seances}
        aujourdhui={rangDuJour(maintenant)}
        objectif={donnees.objectifHebdo}
      />
      <KpiCards chiffres={chiffresCles(seances, bornes, FUSEAU)} />
      {/* Les deux lectures de la période côte à côte (2/3 – 1/3), puis les deux listes. */}
      <div className="grid @4xl:grid-cols-3 gap-4">
        <TrendChart
          className="@4xl:col-span-2"
          points={tendance(seances, bornes, FUSEAU)}
          unite={bornes.unite}
        />
        <MusclesCard charge={chargeMuscles(seances, bornes, FUSEAU)} />
      </div>
      <div className="grid @4xl:grid-cols-2 gap-4">
        <RecentSessions seances={seances.slice(0, 5)} />
        <RecentRecords records={recordsRecents(seances, bornes, FUSEAU, 5)} />
      </div>
    </div>
  );
}

function HomeEmpty() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Dumbbell />
        </EmptyMedia>
        <EmptyTitle>Pas encore de séance</EmptyTitle>
        <EmptyDescription>
          Les séances enregistrées depuis le téléphone apparaîtront ici.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link to="/routines">Voir les routines</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
