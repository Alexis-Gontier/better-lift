import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import {
  BodyCard,
  PinnedCard,
  RecordsCard,
  RoutinesCard,
  StrengthCard,
} from "@/features/home/home-cards";
import { HomeEmpty, HomeSkeleton } from "@/features/home/home-states";
import { HomeTiles } from "@/features/home/home-tiles";
import { useRecordEvents } from "@/features/records/insights";
import { usePins } from "@/mocks/pins";
import { useSessions } from "@/mocks/session-store";

export const Route = createFileRoute("/_app/")({
  staticData: { crumb: "Accueil" },
  component: HomePage,
});

/**
 * L'Accueil résume les autres pages (D282) : une rangée de chiffres avec leur tendance, puis une
 * carte à graphique par sujet. Chaque tuile et chaque carte mène à la page qui détaille.
 */
function HomePage() {
  const { state } = useProto();
  const sessions = useSessions();
  const events = useRecordEvents();
  const { slugs } = usePins();
  return (
    <Page title="Accueil">
      {state === "chargement" && <HomeSkeleton />}
      {state === "erreur" && <StateError title="L'accueil n'a pas pu se charger" />}
      {state === "vide" && <HomeEmpty />}
      {state === "nominal" && (
        <>
          <HomeTiles sessions={sessions} events={events} />
          <div className="grid items-stretch gap-4 @4xl:grid-cols-3">
            <RecordsCard events={events} className="@4xl:col-span-2" />
            <PinnedCard slugs={slugs} />
          </div>
          <div className="grid items-stretch gap-4 @4xl:grid-cols-3">
            <StrengthCard slugs={slugs} />
            <RoutinesCard sessions={sessions} />
            <BodyCard />
          </div>
        </>
      )}
    </Page>
  );
}
