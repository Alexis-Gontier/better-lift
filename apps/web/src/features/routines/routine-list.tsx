import { Link } from "@tanstack/react-router";
import { ListChecks, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { exerciseBySlug } from "@/mocks/exercises";
import { FOLDERS, type MockRoutine } from "@/mocks/routines";
import { RoutineCard } from "./routine-card";

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
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={2}
          value={folder}
          onValueChange={(v) => setFolder(v || ALL)}
          className="flex-wrap"
        >
          <ToggleGroupItem value={ALL}>Tous les dossiers</ToggleGroupItem>
          {FOLDERS.map((f) => (
            <ToggleGroupItem key={f} value={f}>
              {f}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {shown.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucune routine ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot ou un autre dossier.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <RoutineCard key={r.id} routine={r} />
          ))}
        </div>
      )}
    </>
  );
}

export function RoutineListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["a", "b", "c", "d", "e", "f"].map((k) => (
          <Skeleton key={k} className="h-40 rounded-xl" />
        ))}
      </div>
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
