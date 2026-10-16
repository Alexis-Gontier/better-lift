import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { formatDelta, formatKg, formatMinutes } from "@/lib/format";
import { mockSessions } from "@/mocks/sessions";
import { weekStreak, weekSummary } from "@/mocks/stats";
import { TODAY } from "@/mocks/today";

type Tile = { label: string; value: string; delta: string; hint: string };

export function WeekStats() {
  const { current, previous } = weekSummary(mockSessions, TODAY);
  const streak = weekStreak(mockSessions, TODAY);
  const tiles: Tile[] = [
    {
      label: "Séances",
      value: String(current.count),
      delta: formatDelta(current.count, previous.count),
      hint: "vs semaine dernière",
    },
    {
      label: "Volume",
      value: formatKg(current.volume),
      delta: formatDelta(current.volume, previous.volume, true),
      hint: "vs semaine dernière",
    },
    {
      label: "Durée",
      value: formatMinutes(current.minutes),
      delta: formatDelta(current.minutes, previous.minutes, true),
      hint: "vs semaine dernière",
    },
    {
      label: "Semaines d'affilée",
      value: String(streak),
      delta: streak > 0 ? "En cours" : "À relancer",
      hint: "avec au moins une séance",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} size="sm">
          <CardHeader>
            <CardDescription>{t.label}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {/* Hors de CardTitle : en taille « sm », la carte impose sa taille de titre. */}
            <span className="font-semibold text-2xl tabular-nums">{t.value}</span>
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Badge variant="outline" className="tabular-nums">
                {t.delta}
              </Badge>
              {t.hint}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
