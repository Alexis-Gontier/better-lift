import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { ConsistencyCard } from "@/features/home/consistency-card";
import { GoalsCard } from "@/features/home/goals-card";
import { HomeEmpty, HomeError, HomeSkeleton } from "@/features/home/home-states";
import { RecentRecords, RecentSessions } from "@/features/home/recent-lists";
import { TodayCard } from "@/features/home/today-card";
import { WeekStats } from "@/features/home/week-stats";
import { WeeklyVolumeChart } from "@/features/home/weekly-volume-chart";
import { WeightCard } from "@/features/home/weight-card";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  component: HomePage,
});

function HomePage() {
  const { state } = useProto();
  return (
    <Page title="Accueil">
      {state === "chargement" && <HomeSkeleton />}
      {state === "erreur" && <HomeError />}
      {state === "vide" && <HomeEmpty />}
      {state === "nominal" && (
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
    </Page>
  );
}
