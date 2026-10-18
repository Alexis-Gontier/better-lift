import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PERIODS, type Period } from "@/mocks/progress";

/** La période en boutons (D267) : quatre choix, tous visibles, la même sur Corps. */
export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Période"
      value={value}
      onValueChange={(v) => v && onChange(v as Period)}
    >
      {PERIODS.map((p) => (
        <ToggleGroupItem key={p.value} value={p.value}>
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
