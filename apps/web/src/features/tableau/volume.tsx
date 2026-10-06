import { formaterCharge, type StatsPeriode } from "@better-lift/shared";
import { Bar, BarChart, Cell, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SYSTEME_UNITES } from "@/lib/unites";
import { volumesAffiches } from "./calculs";
import { Carte } from "./carte";

const CONFIG = { volumeKg: { label: "Volume" } } satisfies ChartConfig;
const kg = (v: number) => formaterCharge(Math.round(v), SYSTEME_UNITES);

/** Le volume par semaine, par mois en Année (D137, D159). La barre courante en encre, jamais en lime. */
export function Volume({ stats }: { stats: StatsPeriode }) {
  const barres = volumesAffiches(stats.volumes, stats.periode);
  const total = barres.reduce((s, b) => s + b.volumeKg, 0);

  return (
    <Carte
      titre={stats.periode === "annee" ? "Volume par mois" : "Volume par semaine"}
      detail={`${kg(total)} sur la période`}
      className="lg:col-span-5"
    >
      <ChartContainer config={CONFIG} className="aspect-auto h-44 w-full">
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
            content={<ChartTooltipContent hideIndicator formatter={(v) => kg(Number(v))} />}
          />
          {/* Les animations de Recharts échappent à `prefers-reduced-motion` : coupées. */}
          <Bar dataKey="volumeKg" radius={4} minPointSize={2} isAnimationActive={false}>
            {barres.map((b) => (
              <Cell key={b.cle} fill={b.courante ? "var(--ink-muted)" : "var(--line-strong)"} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="sr-only">{barres.map((b) => `${b.libelle} : ${kg(b.volumeKg)}`).join(", ")}</p>
    </Carte>
  );
}
