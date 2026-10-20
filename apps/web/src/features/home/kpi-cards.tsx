import type { ChiffresCles } from "@better-lift/shared";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDelta, formatKg, formatNumber } from "@/lib/format";

type Chiffre = {
  libelle: string;
  valeur: string;
  actuel: number;
  precedent?: number;
  pourcent?: boolean;
};

/**
 * Les quatre chiffres clés de la période (D330), chacun comparé à la période précédente. L'écart
 * se lit par une flèche et un signe, jamais par une couleur : la hausse du volume n'est ni
 * « bien » ni « mal ».
 */
export function KpiCards({ chiffres }: { chiffres: ChiffresCles }) {
  const { actuelle: a, precedente: p } = chiffres;
  const liste: Chiffre[] = [
    {
      libelle: "Séances",
      valeur: formatNumber(a.seances),
      actuel: a.seances,
      precedent: p?.seances,
    },
    {
      libelle: "Volume",
      valeur: formatKg(a.volumeKg),
      actuel: a.volumeKg,
      precedent: p?.volumeKg,
      pourcent: true,
    },
    { libelle: "Séries", valeur: formatNumber(a.series), actuel: a.series, precedent: p?.series },
    {
      libelle: "Records battus",
      valeur: formatNumber(a.records),
      actuel: a.records,
      precedent: p?.records,
    },
  ];
  return (
    <div className="grid @3xl:grid-cols-4 grid-cols-2 gap-4">
      {liste.map((c) => (
        <Card key={c.libelle} className="gap-1 px-4">
          <p className="text-muted-foreground text-sm">{c.libelle}</p>
          <p className="font-semibold @lg:text-3xl text-2xl tabular-nums tracking-tight">
            {c.valeur}
          </p>
          <Ecart chiffre={c} />
        </Card>
      ))}
    </div>
  );
}

function Ecart({ chiffre: c }: { chiffre: Chiffre }) {
  if (c.precedent === undefined) {
    return <p className="text-muted-foreground text-xs">Première période</p>;
  }
  const Icone = c.actuel > c.precedent ? ArrowUp : c.actuel < c.precedent ? ArrowDown : Minus;
  return (
    <p className="flex items-center gap-1 text-muted-foreground text-xs">
      <Icone className="size-3.5 text-foreground" aria-hidden />
      <span className="whitespace-nowrap font-medium text-foreground tabular-nums">
        {formatDelta(c.actuel, c.precedent, c.pourcent)}
      </span>
      {/* En colonne étroite, la précision ne reste que pour le lecteur d'écran. */}
      <span className="@lg:not-sr-only sr-only">vs période préc.</span>
    </p>
  );
}
