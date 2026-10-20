import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/** La semaine en cours (D330) : les jours entraînés et l'objectif hebdomadaire (D129). */
export function ThisWeek({
  jours,
  seances,
  aujourdhui,
  objectif,
  className,
}: {
  jours: boolean[];
  seances: number;
  /** Rang du jour, 0 = lundi. */
  aujourdhui: number;
  objectif: number | null;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cette semaine</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-6">
        <ol className="flex justify-between gap-1">
          {JOURS.map(([lettre, nom], i) => (
            <li
              key={nom}
              aria-label={`${nom}, ${jours[i] ? "entraîné" : "repos"}${i === aujourdhui ? ", aujourd'hui" : ""}`}
              className={cn(
                "flex size-9 items-center justify-center rounded-full font-medium text-xs",
                jours[i] ? "bg-primary text-primary-foreground" : "border text-muted-foreground",
                i === aujourdhui && "ring-2 ring-ring ring-offset-2 ring-offset-card",
              )}
            >
              {lettre}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            <span className="font-semibold text-2xl tabular-nums">{seances}</span>
            {objectif ? (
              <span className="text-muted-foreground"> / {plural(objectif, "séance")}</span>
            ) : (
              <span className="text-muted-foreground"> {seances > 1 ? "séances" : "séance"}</span>
            )}
          </p>
          {objectif ? (
            <Progress
              value={Math.min(100, (seances / objectif) * 100)}
              aria-label={`${seances} séances sur un objectif de ${objectif}`}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
