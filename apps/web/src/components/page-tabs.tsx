import { Link, useSearch } from "@tanstack/react-router";
import { parseProtoSearch } from "@/components/proto/proto-search";
import type { FileRouteTypes } from "@/routeTree.gen";

type Tab = { value: string; label: string };

const tabBase =
  "-mb-px border-b-2 border-transparent px-3 pb-2.5 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground";
// Onglets d'URL : actif par `data-active` (calculé, l'onglet par défaut n'est pas dans l'URL).
const tabClass = `${tabBase} data-[active=true]:border-foreground data-[active=true]:text-foreground`;
// Onglets de route : actif par `data-status`, posé par le routeur lui-même.
const routeTabClass = `${tabBase} data-[status=active]:border-foreground data-[status=active]:text-foreground`;

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

/** Onglets d'état local : ceux d'une liste, qui doivent tenir d'un élément ouvert à l'autre. */
export function LocalTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return tabs.map((t) => (
    <button
      key={t.value}
      type="button"
      data-active={t.value === value}
      onClick={() => onChange(t.value)}
      className={tabClass}
    >
      {t.label}
    </button>
  ));
}

/** Onglets qui sont des routes (Paramètres). */
export function RouteTabs({
  tabs,
}: {
  tabs: readonly { to: FileRouteTypes["to"]; label: string }[];
}) {
  return tabs.map((t) => (
    <Link key={t.to} to={t.to} className={routeTabClass}>
      {t.label}
    </Link>
  ));
}
