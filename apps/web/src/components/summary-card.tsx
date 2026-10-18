import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type SummaryRow = {
  label: string;
  value: ReactNode;
  /** L'écart avec la version enregistrée ou la fois précédente : « +2 », « −8 % ». */
  delta?: string;
  /** Une précision sous la valeur : une date, une unité. */
  hint?: string;
};

/**
 * Des chiffres en lignes dans une seule carte (D265) : le libellé à gauche, la valeur à droite.
 * Lisible à toute largeur de colonne, là où des mini-cartes s'empilaient une par ligne.
 */
export function SummaryCard({ title, rows }: { title: string; rows: SummaryRow[] }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between gap-3 border-b py-2 first:pt-0 last:border-b-0 last:pb-0"
            >
              <dt className="min-w-0 text-muted-foreground text-sm">{r.label}</dt>
              {/* La valeur ne se coupe jamais : c'est le libellé qui passe à la ligne. */}
              <dd className="flex shrink-0 flex-col items-end whitespace-nowrap text-right">
                <span className="flex items-baseline gap-1.5">
                  {r.delta && (
                    <span className="text-muted-foreground text-xs tabular-nums">{r.delta}</span>
                  )}
                  <span className="font-medium text-sm tabular-nums">{r.value}</span>
                </span>
                {r.hint && <span className="text-muted-foreground text-xs">{r.hint}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
