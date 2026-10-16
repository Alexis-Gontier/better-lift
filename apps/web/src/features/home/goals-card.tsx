import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/format";
import { mockGoals } from "@/mocks/goals";

/** Pour le poids, l'objectif peut être à la baisse : l'avancement part de 85 kg. */
function progressOf(current: number, target: number): number {
  if (target >= current) return Math.round((current / target) * 100);
  const start = 85;
  return Math.round(((start - current) / (start - target)) * 100);
}

export function GoalsCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Objectifs</CardTitle>
        <CardDescription>{mockGoals.length} en cours</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {mockGoals.map((g) => (
          <div key={g.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span>{g.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatNumber(g.current)} / {formatNumber(g.target)} {g.unit}
              </span>
            </div>
            <Progress value={progressOf(g.current, g.target)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
