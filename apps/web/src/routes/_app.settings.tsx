import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { RouteTabs } from "@/components/page-tabs";

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

function SettingsLayout() {
  return (
    <Page title="Paramètres" tabs={<RouteTabs tabs={TABS} />}>
      <Outlet />
    </Page>
  );
}
