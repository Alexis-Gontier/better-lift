import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";

const JOURS = [
  ["L", "lundi"],
  ["M", "mardi"],
  ["M", "mercredi"],
  ["J", "jeudi"],
  ["V", "vendredi"],
  ["S", "samedi"],
  ["D", "dimanche"],
] as const;

/**
 * La semaine en cours (D330), en bandeau en tête de page : les jours entraînés et l'objectif
 * hebdomadaire (D129). Elle ne dépend pas de la période choisie.
 */
export function ThisWeek({
  jours,
  seances,
  aujourdhui,
  objectif,
}: {
  jours: boolean[];
  seances: number;
  /** Rang du jour, 0 = lundi. */
  aujourdhui: number;
  objectif: number | null;
}) {
  return (
    <Card className="@2xl:flex-row @2xl:items-center gap-4 px-4">
      <h2 className="font-medium text-base">Cette semaine</h2>
      <ol className="flex gap-1.5">
        {JOURS.map(([lettre, nom], i) => (
          <li
            key={nom}
            aria-label={`${nom}, ${jours[i] ? "entraîné" : "repos"}${i === aujourdhui ? ", aujourd'hui" : ""}`}
            className={cn(
              "flex size-8 items-center justify-center rounded-full font-medium text-xs",
              jours[i] ? "bg-primary text-primary-foreground" : "border text-muted-foreground",
              i === aujourdhui && "ring-2 ring-ring ring-offset-2 ring-offset-card",
            )}
          >
            {lettre}
          </li>
        ))}
      </ol>
      <div className="flex @2xl:flex-1 items-center gap-4 @2xl:justify-end">
        <p className="whitespace-nowrap text-sm">
          <span className="font-semibold text-lg tabular-nums">{seances}</span>
          <span className="text-muted-foreground">
            {objectif
              ? ` / ${plural(objectif, "séance")}`
              : ` ${seances > 1 ? "séances" : "séance"}`}
          </span>
        </p>
        {objectif ? (
          <Progress
            className="@2xl:w-40 w-full"
            value={Math.min(100, (seances / objectif) * 100)}
            aria-label={`${seances} séances sur un objectif de ${objectif}`}
          />
        ) : null}
      </div>
    </Card>
  );
}
