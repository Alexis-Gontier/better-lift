import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKg, formatMinutes, formatWeekdayDay } from "@/lib/format";
import { usePins } from "@/mocks/pins";
import { useSessions } from "@/mocks/session-store";
import { insightOf, useRecordEvents } from "../records/insights";
import { PinButton } from "../records/pin-button";
import { setText } from "../records/record-row";

/** Variante B (D277) : les dernières séances résumées par leurs records ; les épinglés à droite. */
export function HomeFeed() {
  const sessions = useSessions().slice(0, 8);
  const events = useRecordEvents();
  const { slugs } = usePins();
  return (
    <div className="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-lg">Dernières séances</h2>
        {sessions.map((s) => {
          const these = events.filter((e) => e.sessionId === s.id);
          return (
            <Link key={s.id} to="/history/$id" params={{ id: s.id }} className="group">
              <Card
                size="sm"
                className={
                  these.length === 0
                    ? "gap-0 px-4 text-muted-foreground transition-colors group-hover:bg-muted/40"
                    : "gap-2 px-4 transition-colors group-hover:bg-muted/40"
                }
              >
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium first-letter:uppercase">
                    {s.routine} · {formatWeekdayDay(s.date)}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {formatMinutes(s.minutes)} · {formatKg(s.volume)}
                    {these.length === 0 && " · aucun record"}
                  </span>
                </div>
                {these.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <Trophy className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {insightOf(e.slug)?.name ?? e.slug}
                    </span>
                    <span className="shrink-0 tabular-nums">{setText(e)}</span>
                  </div>
                ))}
              </Card>
            </Link>
          );
        })}
      </section>
      <Card className="gap-0 pb-0">
        <CardHeader className="pb-3">
          <CardTitle>Épinglés</CardTitle>
        </CardHeader>
        {slugs.flatMap((slug) => {
          const i = insightOf(slug);
          if (!i) return [];
          return (
            <div key={slug} className="flex items-center gap-2 border-t py-2 pr-2 pl-4">
              <Link
                to="/exercises/$slug"
                params={{ slug }}
                className="flex min-w-0 flex-1 flex-col hover:underline"
              >
                <span className="truncate text-sm">{i.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {i.reach
                    ? `${setText(i.reach.target)} bat le record`
                    : i.best1rm > 0
                      ? `1RM ${formatKg(Math.round(i.best1rm))}`
                      : i.muscle}
                </span>
              </Link>
              <PinButton slug={slug} />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
