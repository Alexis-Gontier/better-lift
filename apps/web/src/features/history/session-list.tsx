import { Link } from "@tanstack/react-router";
import { ChevronRight, History, Search, Trophy } from "lucide-react";
import { useState } from "react";
import { SelectableRow } from "@/components/list-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatKg, formatMinutes, formatMonth, formatWeekdayDay } from "@/lib/format";
import { groupByMonth } from "@/mocks/history";
import type { MockSession } from "@/mocks/sessions";

const ALL = "toutes";
const MONTHS_PER_PAGE = 3;

const fold = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function SessionList({ sessions }: { sessions: MockSession[] }) {
  const [query, setQuery] = useState("");
  const [routine, setRoutine] = useState(ALL);
  const [pages, setPages] = useState(1);
  const routines = [...new Set(sessions.map((s) => s.routine))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  const shown = sessions.filter(
    (s) =>
      (routine === ALL || s.routine === routine) && fold(s.routine).includes(fold(query.trim())),
  );
  const groups = groupByMonth(shown);
  const visible = groups.slice(0, pages * MONTHS_PER_PAGE);

  return (
    <>
      <div className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupInput
            placeholder="Rechercher une séance…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={2}
          value={routine}
          onValueChange={(v) => setRoutine(v || ALL)}
          className="flex-wrap"
        >
          <ToggleGroupItem value={ALL}>Toutes les routines</ToggleGroupItem>
          {routines.map((r) => (
            <ToggleGroupItem key={r} value={r}>
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {groups.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucune séance ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot ou une autre routine.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {visible.map((g) => {
        const volume = g.sessions.reduce((sum, s) => sum + s.volume, 0);
        return (
          <section key={g.month} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium first-letter:uppercase">{formatMonth(g.month)}</h2>
              <span className="text-muted-foreground text-xs tabular-nums">
                {g.sessions.length} séances · {formatKg(volume)}
              </span>
            </div>
            <Card className="gap-0 py-0">
              {g.sessions.map((s, i) => (
                <div key={s.id}>
                  {i > 0 && <Separator />}
                  <SelectableRow
                    id={s.id}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                    renderLink={(className, children) => (
                      <Link to="/history/$id" params={{ id: s.id }} className={className}>
                        {children}
                      </Link>
                    )}
                  >
                    <span className="w-24 shrink-0 text-muted-foreground text-sm first-letter:uppercase">
                      {formatWeekdayDay(s.date)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{s.routine}</span>
                    {s.records > 0 && (
                      <Badge variant="outline">
                        <Trophy data-icon="inline-start" />
                        {s.records}
                      </Badge>
                    )}
                    <span className="hidden w-16 shrink-0 text-right text-muted-foreground text-sm tabular-nums @xl:block">
                      {formatMinutes(s.minutes)}
                    </span>
                    <span className="w-24 text-right text-sm tabular-nums">
                      {formatKg(s.volume)}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </SelectableRow>
                </div>
              ))}
            </Card>
          </section>
        );
      })}

      {visible.length < groups.length && (
        <Button variant="outline" className="self-center" onClick={() => setPages((p) => p + 1)}>
          Afficher les mois précédents
        </Button>
      )}
    </>
  );
}

export function SessionListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-72 rounded-xl" />
    </>
  );
}

export function SessionListEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <History />
        </EmptyMedia>
        <EmptyTitle>Pas encore de séance</EmptyTitle>
        <EmptyDescription>
          Les séances se font sur le mobile ; elles apparaîtront ici dès la première.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" asChild>
          <Link to="/settings/data">Importer depuis Hevy</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
