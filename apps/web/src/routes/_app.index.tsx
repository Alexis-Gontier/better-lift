import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { ConsistencyCard } from "@/features/home/consistency-card";
import { GoalsCard } from "@/features/home/goals-card";
import { HomeEmpty, HomeSkeleton } from "@/features/home/home-states";
import { RecentRecords, RecentSessions } from "@/features/home/recent-lists";
import { TodayCard } from "@/features/home/today-card";
import { WeekStats } from "@/features/home/week-stats";
import { WeeklyVolumeChart } from "@/features/home/weekly-volume-chart";
import { WeightCard } from "@/features/home/weight-card";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  component: HomePage,
});

/** A : grille de cartes. B : colonne principale et colonne latérale. */
function HomePage() {
  const { state, variant } = useProto();
  return (
    <Page title="Accueil">
      {state === "chargement" && <HomeSkeleton />}
      {state === "erreur" && <StateError title="L'accueil n'a pas pu se charger" />}
      {state === "vide" && <HomeEmpty />}
      {state === "nominal" && variant === "a" && (
        <>
          <TodayCard />
          <WeekStats />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <WeeklyVolumeChart />
            </div>
            <WeightCard />
          </div>
          <ConsistencyCard />
          <div className="grid gap-4 md:grid-cols-3">
            <GoalsCard />
            <RecentRecords />
            <RecentSessions />
          </div>
        </>
      )}
      {/* Variante B : une colonne principale, une colonne latérale étroite. */}
      {state === "nominal" && variant !== "a" && (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="@container flex min-w-0 flex-col gap-4">
            <TodayCard />
            <WeekStats />
            <WeeklyVolumeChart />
            <ConsistencyCard />
          </div>
          <div className="flex flex-col gap-4">
            <WeightCard />
            <GoalsCard />
            <RecentRecords />
            <RecentSessions />
          </div>
        </div>
      )}
    </Page>
  );
}
