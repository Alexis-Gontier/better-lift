import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { RouteTabs } from "@/components/page-tabs";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/settings")({
  staticData: { crumb: "Paramètres" },
  component: SettingsLayout,
});

const TABS = [
  { to: "/settings/account", label: "Compte" },
  { to: "/settings/preferences", label: "Préférences" },
  { to: "/settings/training", label: "Entraînement" },
  { to: "/settings/data", label: "Données" },
] as const;

/** Des réglages existent toujours : l'état « vide » montre la page normale. */
function SettingsLayout() {
  const { state } = useProto();
  return (
    <Page title="Paramètres" tabs={<RouteTabs tabs={TABS} />}>
      {state === "chargement" &&
        ["a", "b", "c"].map((k) => <Skeleton key={k} className="h-48 rounded-xl" />)}
      {state === "erreur" && <StateError title="Les paramètres n'ont pas pu se charger" />}
      {(state === "nominal" || state === "vide") && (
        <div className="flex max-w-3xl flex-col gap-6">
          <Outlet />
        </div>
      )}
    </Page>
  );
}
