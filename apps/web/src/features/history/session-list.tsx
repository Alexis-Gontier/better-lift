import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ChevronRight, History, ListChecks, Search, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { DragScroll } from "@/components/drag-scroll";
import { listCardClass, listLinkProps } from "@/components/list-detail";
import { type RowAction, RowMenu } from "@/components/row-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fold } from "@/lib/fold";
import { formatKg, formatMinutes, formatMonth, formatWeekdayDay, plural } from "@/lib/format";
import { groupByMonth } from "@/mocks/history";
import { mockRoutines } from "@/mocks/routines";
import type { MockSession } from "@/mocks/sessions";
import { DeleteSessionDialog } from "./session-pane";

const ALL = "toutes";
const MONTHS_PER_PAGE = 3;

export function SessionList({ sessions }: { sessions: MockSession[] }) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<MockSession | null>(null);
  /** Le clic droit sur une séance. */
  const sessionActions = (s: MockSession): RowAction[] => {
    const routine = mockRoutines.find((r) => r.name === s.routine);
    return [
      ...(routine
        ? [
            {
              label: "Voir la routine",
              icon: ListChecks,
              onSelect: () => navigate({ to: "/routines/$id", params: { id: routine.id } }),
            },
          ]
        : []),
      {
        label: "Supprimer",
        icon: Trash2,
        onSelect: () => setDeleting(s),
        destructive: true,
        separated: true,
      },
    ];
  };
  const [query, setQuery] = useState("");
  const [routine, setRoutine] = useState(ALL);
  // Une séance ouverte par son adresse doit être visible : on déplie jusqu'à son mois.
  const { id: openId } = useParams({ strict: false });
  const [pages, setPages] = useState(() => {
    const index = groupByMonth(sessions).findIndex((g) => g.sessions.some((s) => s.id === openId));
    return Math.max(1, Math.ceil((index + 1) / MONTHS_PER_PAGE));
  });
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
        <DragScroll>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={2}
            value={routine}
            onValueChange={(v) => setRoutine(v || ALL)}
            className="w-max"
          >
            <ToggleGroupItem value={ALL}>Toutes les routines</ToggleGroupItem>
            {routines.map((r) => (
              <ToggleGroupItem key={r} value={r}>
                {r}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </DragScroll>
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
                {plural(g.sessions.length, "séance")} · {formatKg(volume)}
              </span>
            </div>
            {/* Une carte par séance, séparées (D258, comme les routines). */}
            <div className="flex flex-col gap-2">
              {g.sessions.map((s) => (
                <Card key={s.id} size="sm" className={listCardClass}>
                  <RowMenu actions={sessionActions(s)}>
                    <Link
                      to="/history/$id"
                      params={{ id: s.id }}
                      {...listLinkProps}
                      className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{s.routine}</span>
                        <span className="truncate text-muted-foreground text-xs first-letter:uppercase">
                          {formatWeekdayDay(s.date)} · {formatMinutes(s.minutes)}
                        </span>
                      </span>
                      {s.records > 0 && (
                        <Badge variant="outline" className="shrink-0">
                          <Trophy data-icon="inline-start" />
                          {s.records}
                        </Badge>
                      )}
                      <span className="shrink-0 text-right text-sm tabular-nums">
                        {formatKg(s.volume)}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </RowMenu>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {visible.length < groups.length && (
        <Button variant="outline" className="self-center" onClick={() => setPages((p) => p + 1)}>
          Afficher les mois précédents
        </Button>
      )}

      <DeleteSessionDialog session={deleting} onOpenChange={() => setDeleting(null)} />
    </>
  );
}

/** La liste pendant le chargement : recherche, filtres, puis deux mois et leurs cartes. */
export function SessionListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <div className="flex gap-2">
        {/* Les puces de filtre : « Toutes les routines », puis une par routine. */}
        <Skeleton className="h-8 w-36 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
      </div>
      {[4, 3].map((count, m) => (
        <div key={m} className="flex flex-col gap-2">
          <Skeleton className="my-1 h-5 w-36 rounded" />
          {Array.from({ length: count }, (_, i) => (
            <Skeleton key={i} className="h-[3.875rem] rounded-xl" />
          ))}
        </div>
      ))}
    </>
  );
}

/** Aucune séance : la liste le dit d'une ligne, le panneau de droite explique (D260). */
export function SessionListEmpty() {
  return (
    <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
      Aucune séance pour l'instant.
    </p>
  );
}

/** Le panneau de droite sans aucune séance : d'où elles viennent. */
export function SessionsOnboarding() {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <History />
        </EmptyMedia>
        <EmptyTitle>Pas encore de séance</EmptyTitle>
        <EmptyDescription>
          Les séances se font sur le téléphone ; elles arrivent ici dès la première, comparées à la
          précédente de la même routine.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
