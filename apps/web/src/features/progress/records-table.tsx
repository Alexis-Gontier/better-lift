import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatKg, formatShortDay } from "@/lib/format";
import { exerciseHistory } from "@/mocks/exercise-history";
import { records } from "@/mocks/exercise-stats";
import { MUSCLES, mockExercises } from "@/mocks/exercises";
import { inPeriod, type Period } from "@/mocks/progress";
import { TODAY } from "@/mocks/today";

const ALL = "tous";
type SortKey = "name" | "heaviest" | "best1rm" | "bestVolume" | "date";

type Row = {
  slug: string;
  name: string;
  muscle: string;
  heaviest: number;
  best1rm: number;
  bestVolume: number;
  /** Date du record le plus récent des trois. */
  date: string;
};

function rowsFor(period: Period): Row[] {
  return mockExercises.flatMap((e) => {
    const history = inPeriod(exerciseHistory(e.slug), period, TODAY);
    if (history.length === 0) return [];
    const r = records(history);
    return [
      {
        slug: e.slug,
        name: e.name,
        muscle: e.muscle,
        heaviest: r.heaviest.value,
        best1rm: Math.round(r.best1rm.value),
        bestVolume: r.bestVolume.value,
        // Au poids du corps, aucune charge ne bat 0 : la date retombe sur la dernière exécution.
        date:
          [r.heaviest.date, r.best1rm.date, r.bestVolume.date].filter(Boolean).sort().at(-1) ??
          history.at(-1)?.date ??
          TODAY,
      },
    ];
  });
}

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "name", label: "Exercice" },
  { key: "heaviest", label: "Meilleure charge", numeric: true },
  { key: "best1rm", label: "1RM estimé", numeric: true },
  { key: "bestVolume", label: "Meilleur volume", numeric: true },
  { key: "date", label: "Dernier record", numeric: true },
];

export function RecordsTable({ period }: { period: Period }) {
  const [muscle, setMuscle] = useState(ALL);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "date", desc: true });

  const rows = rowsFor(period)
    .filter((r) => muscle === ALL || r.muscle === muscle)
    .sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "fr");
      return sort.desc ? -cmp : cmp;
    });

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "name" }));

  return (
    <>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={2}
        value={muscle}
        onValueChange={(v) => setMuscle(v || ALL)}
        className="flex-wrap"
      >
        <ToggleGroupItem value={ALL}>Tous les muscles</ToggleGroupItem>
        {MUSCLES.map((m) => (
          <ToggleGroupItem key={m} value={m}>
            {m}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucun record sur la période</EmptyTitle>
            <EmptyDescription>
              Élargissez la période ou choisissez un autre muscle.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map((c) => (
                  <TableHead
                    key={c.key}
                    className={c.numeric ? "text-right last:pr-4" : "pl-4"}
                    aria-sort={
                      sort.key === c.key ? (sort.desc ? "descending" : "ascending") : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c.label}
                      {sort.key === c.key &&
                        (sort.desc ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUp className="size-3" />
                        ))}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.slug}>
                  <TableCell className="pl-4">
                    <Link
                      to="/exercises/$slug"
                      params={{ slug: r.slug }}
                      search={{ onglet: "records" }}
                      className="font-medium hover:underline"
                    >
                      {r.name}
                    </Link>
                    <div className="text-muted-foreground text-xs">{r.muscle}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.heaviest > 0 ? formatKg(r.heaviest) : "Poids du corps"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.best1rm > 0 ? formatKg(r.best1rm) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.bestVolume > 0 ? formatKg(r.bestVolume) : "—"}
                  </TableCell>
                  <TableCell className="pr-4 text-right text-muted-foreground tabular-nums">
                    {formatShortDay(r.date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
