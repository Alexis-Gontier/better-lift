import { Link } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { DragScroll } from "@/components/drag-scroll";
import { ExerciseThumb } from "@/components/exercise-media";
import { listCardClass, listLinkProps } from "@/components/list-detail";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fold } from "@/lib/fold";
import { formatDaysAgo, formatKg } from "@/lib/format";
import { exerciseHistory } from "@/mocks/exercise-history";
import { best1rmOf } from "@/mocks/exercise-stats";
import { EQUIPMENTS, type MockExercise, MUSCLES } from "@/mocks/exercises";
import { daysSince } from "@/mocks/routine-stats";
import { TODAY } from "@/mocks/today";

const ALL = "tous";
type Sort = "nom" | "recent";

type Row = MockExercise & { lastDone: string | null; best1rm: number };

function toRow(e: MockExercise): Row {
  const history = exerciseHistory(e.slug);
  const last = history.at(-1);
  return {
    ...e,
    lastDone: last?.date ?? null,
    best1rm: Math.max(0, ...history.map(best1rmOf)),
  };
}

export function ExerciseList({ exercises }: { exercises: MockExercise[] }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState(ALL);
  const [equipment, setEquipment] = useState(ALL);
  const [sort, setSort] = useState<Sort>("nom");

  const rows = exercises
    .map(toRow)
    .filter(
      (e) =>
        (muscle === ALL || e.muscle === muscle) &&
        (equipment === ALL || e.equipment === equipment) &&
        fold(e.name).includes(fold(query.trim())),
    )
    .sort((a, b) =>
      sort === "nom"
        ? a.name.localeCompare(b.name, "fr")
        : (b.lastDone ?? "").localeCompare(a.lastDone ?? ""),
    );

  return (
    <>
      <div className="flex flex-col gap-2">
        <InputGroup>
          <InputGroupInput
            placeholder="Rechercher un exercice…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <DragScroll>
          <div className="flex w-max gap-2">
            <Select value={muscle} onValueChange={setMuscle}>
              <SelectTrigger aria-label="Muscle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL}>Tous les muscles</SelectItem>
                  {MUSCLES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={equipment} onValueChange={setEquipment}>
              <SelectTrigger aria-label="Équipement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL}>Tout équipement</SelectItem>
                  {EQUIPMENTS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label="Tri">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="nom">Par nom</SelectItem>
                  <SelectItem value="recent">Faits récemment</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </DragScroll>
      </div>

      {rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucun exercice ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot, muscle ou équipement.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        // Une carte par exercice, séparées (D258, comme les routines).
        <div className="flex flex-col gap-2">
          {rows.map((e) => (
            <Card key={e.slug} size="sm" className={listCardClass}>
              <Link
                to="/exercises/$slug"
                params={{ slug: e.slug }}
                {...listLinkProps}
                className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3"
              >
                <ExerciseThumb name={e.name} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium" title={e.name}>
                    {e.name}
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    {e.muscle} · {e.equipment}
                  </span>
                </div>
                <div className="hidden w-28 shrink-0 flex-col items-end @xl:flex">
                  <span className="text-sm tabular-nums">
                    {e.best1rm > 0 ? formatKg(Math.round(e.best1rm)) : "—"}
                  </span>
                  <span className="text-muted-foreground text-xs">1RM estimé</span>
                </div>
                <span className="hidden w-20 shrink-0 text-right text-muted-foreground text-xs @2xl:block">
                  {formatDaysAgo(e.lastDone ? daysSince(e.lastDone, TODAY) : null)}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

/** La liste pendant le chargement : la recherche, les filtres, puis des cartes d'exercice. */
export function ExerciseListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-[4.25rem] rounded-xl" />
        ))}
      </div>
    </>
  );
}

/** Le catalogue vide : il ne l'est jamais en pratique, mais l'état existe (`?etat=vide`). */
export function ExerciseListEmpty() {
  return (
    <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
      Le catalogue est vide pour l'instant.
    </p>
  );
}
