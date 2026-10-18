import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Database, Dumbbell, SlidersHorizontal, UserRound } from "lucide-react";
import { Page } from "@/components/page";
import { useProto } from "@/components/proto/use-proto";
import { StateError } from "@/components/states/state-error";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_app/settings")({
  staticData: { crumb: "Paramètres" },
  component: SettingsLayout,
});

const NAV = [
  { to: "/settings/account", label: "Compte", icon: UserRound },
  { to: "/settings/preferences", label: "Préférences", icon: SlidersHorizontal },
  { to: "/settings/training", label: "Entraînement", icon: Dumbbell },
  { to: "/settings/data", label: "Données", icon: Database },
] as const;

/**
 * Paramètres (D271) : la navigation à gauche, comme les réglages de GitHub ou de Linear — tout
 * se voit d'un coup d'œil —, la page à droite. Des réglages existent toujours : l'état « vide »
 * montre la page normale.
 */
function SettingsLayout() {
  const { state } = useProto();
  return (
    <Page title="Paramètres">
      <div className="grid items-start gap-8 @3xl:grid-cols-[12rem_minmax(0,42rem)]">
        <nav aria-label="Paramètres" className="flex gap-1 @3xl:sticky @3xl:top-16 @3xl:flex-col">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-muted data-[status=active]:font-medium data-[status=active]:text-foreground"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-6">
          {state === "chargement" &&
            ["a", "b", "c"].map((k) => <Skeleton key={k} className="h-48 rounded-xl" />)}
          {state === "erreur" && <StateError title="Les paramètres n'ont pas pu se charger" />}
          {(state === "nominal" || state === "vide") && <Outlet />}
        </div>
      </div>
    </Page>
  );
}
