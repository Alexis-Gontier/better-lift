import { formaterCharge, type StatsPeriode } from "@better-lift/shared";
import { useState } from "react";
import { Bar, BarChart, Cell, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SYSTEME_UNITES } from "@/lib/unites";
import { barresGraphique, type Mesure } from "./calculs";
import { Carte } from "./carte";

const CONFIG = { valeur: { label: "Valeur" } } satisfies ChartConfig;
const kg = (v: number) => formaterCharge(Math.round(v), SYSTEME_UNITES);

/**
 * Au moins douze semaines (D187), par mois en Année. Les barres de la période en
 * `primary`, les autres atténuées (D187, D192).
 */
export function Volume({ stats }: { stats: StatsPeriode }) {
  const [mesure, setMesure] = useState<Mesure>("volume");
  const barres = barresGraphique(stats.volumes, stats.periode, mesure);
  const format = (v: number) => (mesure === "volume" ? kg(v) : `${v} séries`);

  return (
    <Carte
      titre={stats.periode === "annee" ? "Par mois" : "Par semaine"}
      detail={
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="Mesure"
          value={mesure}
          onValueChange={(v) => {
            if (v) setMesure(v as Mesure);
          }}
        >
          <ToggleGroupItem value="volume" className="px-2.5">
            Volume
          </ToggleGroupItem>
          <ToggleGroupItem value="series" className="px-2.5">
            Séries
          </ToggleGroupItem>
        </ToggleGroup>
      }
      className="lg:col-span-8"
    >
      <ChartContainer config={CONFIG} className="aspect-auto h-52 w-full">
        <BarChart data={barres} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="libelle"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
            fontSize={10.5}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideIndicator formatter={(v) => format(Number(v))} />}
          />
          {/* Les animations de Recharts échappent à `prefers-reduced-motion` : coupées. */}
          <Bar dataKey="valeur" radius={4} minPointSize={2} isAnimationActive={false}>
            {barres.map((b) => (
              <Cell
                key={b.cle}
                fill={b.dansPeriode ? "var(--primary)" : "var(--muted-foreground)"}
                fillOpacity={b.dansPeriode ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="sr-only">
        {barres.map((b) => `${b.libelle} : ${format(b.valeur)}`).join(", ")}
      </p>
    </Carte>
  );
}
