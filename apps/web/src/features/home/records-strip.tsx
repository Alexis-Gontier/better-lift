import { Card, CardContent } from "@/components/ui/card";
import { plural } from "@/lib/format";
import { recordCounts } from "@/mocks/record-insights";
import { TODAY } from "@/mocks/today";
import { useRecordEvents } from "../records/insights";

/** La ligne de tête de l'Accueil (D277), commune aux trois variantes. */
export function RecordsStrip() {
  const counts = recordCounts(useRecordEvents(), TODAY);
  const figures = [
    { label: "Cette semaine", value: plural(counts.week, "record") },
    { label: "Ce mois", value: plural(counts.month, "record") },
    {
      label: "Semaines d'affilée",
      value: counts.streak > 0 ? plural(counts.streak, "semaine") : "—",
      hint: "avec au moins un record",
    },
  ];
  return (
    <Card size="sm">
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 @xl:grid-cols-3">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">{f.label}</span>
            <span className="font-semibold text-2xl tabular-nums">{f.value}</span>
            {f.hint && <span className="text-muted-foreground text-xs">{f.hint}</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
