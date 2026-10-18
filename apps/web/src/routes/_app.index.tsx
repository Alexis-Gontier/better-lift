import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Button } from "@/components/ui/button";
import { GoalsCard } from "@/features/home/goals-card";
import { HomeEmpty, HomeSkeleton } from "@/features/home/home-states";
import { RecentRecords, RecentSessions } from "@/features/home/recent-lists";
import { TodayCard } from "@/features/home/today-card";
import { WeekStats } from "@/features/home/week-stats";
import { WeightCard } from "@/features/home/weight-card";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  component: HomePage,
});

/**
 * L'Accueil (D270) : aujourd'hui et cette semaine d'abord ; puis les dernières séances, les
 * derniers records, le poids et les objectifs. L'analyse sur la durée vit dans Progression.
 */
function HomePage() {
  const { state } = useProto();
  return (
    <Page
      title="Accueil"
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/progress">
            Voir la progression <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
      }
    >
      {state === "chargement" && <HomeSkeleton />}
      {state === "erreur" && <StateError title="L'accueil n'a pas pu se charger" />}
      {state === "vide" && <HomeEmpty />}
      {state === "nominal" && (
        <>
          <TodayCard />
          <WeekStats />
          <div className="grid items-start gap-4 @3xl:grid-cols-3">
            <RecentSessions />
            <RecentRecords />
            <div className="flex flex-col gap-4">
              <WeightCard />
              <GoalsCard />
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
