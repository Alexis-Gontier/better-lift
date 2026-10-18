const tabBase =
  "-mb-px border-b-2 border-transparent px-3 pb-2.5 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground";
// Onglets d'état : actif par `data-active`.
const tabClass = `${tabBase} data-[active=true]:border-foreground data-[active=true]:text-foreground`;

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
