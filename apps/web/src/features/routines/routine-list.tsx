import { Link, useRouterState } from "@tanstack/react-router";
import { ListChecks, Search } from "lucide-react";
import { useState } from "react";
import { DragScroll } from "@/components/drag-scroll";
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
import { exerciseBySlug } from "@/mocks/exercises";
import { FOLDERS, type MockRoutine } from "@/mocks/routines";
import { DraftRoutineRow, RoutineRow } from "./routine-card";

const ALL = "tous";

/** Sans casse ni accents : « developpe » trouve « Développé ». */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matches(routine: MockRoutine, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const names = routine.exercises.map((e) => exerciseBySlug(e.slug)?.name ?? "");
  return [routine.name, ...names].some((n) => fold(n).includes(q));
}

export function RoutineList({ routines }: { routines: MockRoutine[] }) {
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<string>(ALL);
  const creating = useRouterState({ select: (s) => s.location.pathname === "/routines/new" });
  const shown = routines.filter(
    (r) => (folder === ALL || r.folder === folder) && matches(r, query),
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <InputGroup>
          <InputGroupInput
            placeholder="Rechercher une routine ou un exercice…"
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
            value={folder}
            onValueChange={(v) => setFolder(v || ALL)}
            className="w-max"
          >
            <ToggleGroupItem value={ALL}>Tous les dossiers</ToggleGroupItem>
            {FOLDERS.map((f) => (
              <ToggleGroupItem key={f} value={f}>
                {f}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </DragScroll>
      </div>
      {shown.length === 0 && !creating ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucune routine ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot ou un autre dossier.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="gap-0 py-0">
          {creating && <DraftRoutineRow />}
          {shown.map((r, i) => (
            <div key={r.id}>
              {i > 0 && <Separator />}
              <RoutineRow routine={r} />
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export function RoutineListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <Skeleton className="h-7 w-64 rounded-lg" />
      <Skeleton className="h-72 rounded-xl" />
    </>
  );
}

export function RoutineListEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListChecks />
        </EmptyMedia>
        <EmptyTitle>Pas encore de routine</EmptyTitle>
        <EmptyDescription>
          Une routine prépare une séance : ses exercices, ses séries et ses temps de repos.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/routines/new">Créer une routine</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
