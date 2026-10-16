import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKg, formatMinutes, formatShortDay } from "@/lib/format";
import { mockRecords } from "@/mocks/records";
import { mockSessions } from "@/mocks/sessions";

const rowClass =
  "-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted";

export function RecentRecords() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Records récents</CardTitle>
        <CardDescription>30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {mockRecords.map((r) => (
          <Link key={r.id} to="/exercises/$slug" params={{ slug: r.slug }} className={rowClass}>
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{r.exercise}</span>
              <span className="text-muted-foreground text-xs">
                {r.kind} · {formatShortDay(r.date)}
              </span>
            </span>
            <Badge variant="outline" className="shrink-0 tabular-nums">
              {r.value}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function RecentSessions() {
  const sessions = mockSessions.slice(0, 5);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Dernières séances</CardTitle>
        <CardDescription>Les 5 dernières</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {sessions.map((s) => (
          <Link key={s.id} to="/history/$id" params={{ id: s.id }} className={rowClass}>
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{s.routine}</span>
              <span className="text-muted-foreground text-xs">
                {formatShortDay(s.date)} · {formatMinutes(s.minutes)}
              </span>
            </span>
            <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
              {formatKg(s.volume)}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
