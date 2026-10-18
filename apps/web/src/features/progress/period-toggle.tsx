import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PERIODS, type Period, RECORD_PERIODS } from "@/mocks/progress";

/** La période en boutons (D267), la même sur Corps ; Records y ajoute « Tout » (D278). */
export function PeriodToggle({
  value,
  onChange,
  all = false,
}: {
  value: Period;
  onChange: (period: Period) => void;
  all?: boolean;
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
      {(all ? RECORD_PERIODS : PERIODS).map((p) => (
        <ToggleGroupItem key={p.value} value={p.value}>
          {p.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
