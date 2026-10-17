import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Dumbbell, History, Search, Trophy } from "lucide-react";
import { useState } from "react";
import { DragScroll } from "@/components/drag-scroll";
import { ExerciseThumb } from "@/components/exercise-media";
import { listLinkProps, selectedRowClass } from "@/components/list-detail";
import { type RowAction, RowMenu } from "@/components/row-menu";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fold } from "@/lib/fold";
import { formatDaysAgo, formatKg } from "@/lib/format";
import { exerciseHistory } from "@/mocks/exercise-history";
import { best1rmOf } from "@/mocks/exercise-stats";
import { useExerciseDraftName } from "@/mocks/exercise-store";
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

/** La ligne de l'exercice en cours de création, en tête de liste (D238). */
function DraftExerciseRow() {
  const name = useExerciseDraftName();
  return (
    <Link
      to="/exercises/new"
      {...listLinkProps}
      className={`flex items-center gap-4 border-b border-dashed px-4 py-3 ${selectedRowClass}`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        <Dumbbell className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={name.trim() ? "truncate font-medium" : "text-muted-foreground"}>
          {name.trim() || "Sans nom"}
        </span>
        <span className="text-muted-foreground text-xs">Brouillon · pas encore enregistré</span>
      </div>
    </Link>
  );
}

export function ExerciseList({ exercises }: { exercises: MockExercise[] }) {
  const creating = useRouterState({ select: (s) => s.location.pathname === "/exercises/new" });
  const navigate = useNavigate();
  const exerciseActions = (slug: string): RowAction[] => [
    {
      label: "Voir l'historique",
      icon: History,
      onSelect: () =>
        navigate({ to: "/exercises/$slug", params: { slug }, search: { onglet: "historique" } }),
    },
    {
      label: "Voir les records",
      icon: Trophy,
      onSelect: () =>
        navigate({ to: "/exercises/$slug", params: { slug }, search: { onglet: "records" } }),
    },
  ];
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

      {rows.length === 0 && !creating ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucun exercice ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot, muscle ou équipement.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="gap-0 py-0">
          {creating && <DraftExerciseRow />}
          {rows.map((e, i) => (
            <div key={e.slug}>
              {i > 0 && <Separator />}
              <RowMenu actions={exerciseActions(e.slug)}>
                <Link
                  to="/exercises/$slug"
                  params={{ slug: e.slug }}
                  {...listLinkProps}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 ${selectedRowClass}`}
                >
                  <ExerciseThumb name={e.name} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{e.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {e.muscle} · {e.equipment}
                    </span>
                  </div>
                  {e.custom && <Badge variant="secondary">Personnalisé</Badge>}
                  <div className="hidden w-28 shrink-0 flex-col items-end @xl:flex">
                    <span className="text-sm tabular-nums">
                      {e.best1rm > 0 ? formatKg(Math.round(e.best1rm)) : "—"}
                    </span>
                    <span className="text-muted-foreground text-xs">1RM estimé</span>
                  </div>
                  <span className="hidden w-20 shrink-0 text-right text-muted-foreground text-xs @2xl:block">
                    {formatDaysAgo(e.lastDone ? daysSince(e.lastDone, TODAY) : null)}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </RowMenu>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export function ExerciseListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <Skeleton className="h-9 rounded-lg" />
      <Skeleton className="h-[480px] rounded-xl" />
    </>
  );
}

export function CustomExercisesEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Dumbbell />
        </EmptyMedia>
        <EmptyTitle>Pas encore d'exercice personnalisé</EmptyTitle>
        <EmptyDescription>
          Ajoutez une machine de votre salle ou une variante absente du catalogue.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/exercises/new" search>
            Créer un exercice
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
