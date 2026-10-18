import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { SessionsOnboarding } from "@/features/history/session-list";
import {
  ActivityCalendar,
  RecentSessions,
  RoutineChart,
  VolumeChart,
} from "@/features/home/home-charts";
import { HomeSkeleton, HomeStats } from "@/features/home/home-stats";
import { useSessions } from "@/mocks/session-store";

export const Route = createFileRoute("/_app/")({
  staticData: {
    crumb: "Accueil",
    // La rangée de tête en trois mises en forme, le temps de choisir.
    proto: {
      variants: [
        { value: "a", label: "Sobre" },
        { value: "b", label: "Avant / après" },
        { value: "c", label: "Icône" },
      ],
    },
  },
  component: HomePage,
});

/**
 * L'Accueil, tableau de bord (D287, révise D283) : quatre cartes chiffrées, le calendrier
 * d'assiduité, le volume par semaine, puis les dernières séances et les séances par routine.
 */
function HomePage() {
  const { state, variant } = useProto();
  const sessions = useSessions();
  return (
    <Page title="Accueil">
      {state === "chargement" && <HomeSkeleton />}
      {state === "erreur" && <StateError title="L'accueil n'a pas pu se charger" />}
      {state === "vide" && (
        <div className="flex min-h-96 rounded-xl border border-dashed">
          <SessionsOnboarding />
        </div>
      )}
      {state === "nominal" && (
        <>
          <HomeStats sessions={sessions} variant={variant} />
          <ActivityCalendar sessions={sessions} />
          <VolumeChart sessions={sessions} />
          <div className="grid gap-4 @4xl:grid-cols-3">
            <RecentSessions sessions={sessions} />
            <RoutineChart sessions={sessions} />
          </div>
        </>
      )}
    </Page>
  );
}
