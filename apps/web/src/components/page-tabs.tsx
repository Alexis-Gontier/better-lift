import { Link, useLocation, useSearch } from "@tanstack/react-router";
import { parseProtoSearch } from "@/components/proto/proto-search";
import type { FileRouteTypes } from "@/routeTree.gen";

type Tab = { value: string; label: string };

const tabClass =
  "-mb-px border-b-2 px-3 pb-2.5 font-medium text-sm transition-colors data-[active=true]:border-foreground data-[active=false]:border-transparent data-[active=false]:text-muted-foreground data-[active=false]:hover:text-foreground";

/** L'onglet actif : celui de l'URL s'il existe, sinon le premier. */
export function useTab<T extends string>(values: readonly T[]): T {
  const { onglet } = parseProtoSearch(useSearch({ strict: false }));
  const found = values.find((v) => v === onglet);
  return found ?? (values[0] as T);
}

/** Onglets d'une même page, portés par `?onglet=` : chaque onglet a son adresse. */
export function PageTabs({ tabs }: { tabs: readonly Tab[] }) {
  const active = useTab(tabs.map((t) => t.value));
  return tabs.map((t) => (
    <Link
      key={t.value}
      to="."
      search={(prev) => ({ ...prev, onglet: t.value })}
      data-active={t.value === active}
      className={tabClass}
    >
      {t.label}
    </Link>
  ));
}

/** Onglets qui sont des routes (Paramètres). */
export function RouteTabs({
  tabs,
}: {
  tabs: readonly { to: FileRouteTypes["to"]; label: string }[];
}) {
  const { pathname } = useLocation();
  return tabs.map((t) => (
    <Link key={t.to} to={t.to} data-active={pathname.startsWith(t.to)} className={tabClass}>
      {t.label}
    </Link>
  ));
}
