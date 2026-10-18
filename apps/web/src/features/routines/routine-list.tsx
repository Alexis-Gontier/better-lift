import { normaliserRecherche, type RoutineResume } from "@better-lift/shared";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { etatAffiche } from "@/components/states/etat";
import { StateError } from "@/components/states/state-error";
import { useEtat } from "@/components/states/use-etat";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { dossierRenomme } from "./ecran";
import {
  routinesQuery,
  useDeplacerRoutine,
  useRenommerDossier,
  useSupprimerDossier,
} from "./queries";
import { DraftRoutineRow, RoutineRow, RoutineRowPreview } from "./routine-card";
import { parDossier } from "./stats";

type Dossier = { id: string; nom: string };

/** Sans casse ni accents, sur le nom de la routine et ceux de ses exercices. */
function correspond(routine: RoutineResume, saisie: string): boolean {
  const q = normaliserRecherche(saisie);
  if (!q) return true;
  return [routine.nom, ...routine.exercices.map((e) => e.nom)].some((n) =>
    normaliserRecherche(n).includes(q),
  );
}

/** L'identifiant de dépôt d'un dossier, distinct de ceux des routines ; « - » : sans dossier. */
const dropId = (dossier: Dossier | null) => `dossier:${dossier?.id ?? "-"}`;

const echec = (e: unknown) => toast.error(e instanceof Error ? e.message : "L'action a échoué.");

/** Le nom d'un dossier, en saisie : juste créé, ou « Renommer ». */
function FolderNameInput({ dossier }: { dossier: Dossier }) {
  const renommer = useRenommerDossier();
  const valider = (nom: string) => {
    dossierRenomme.set(null);
    const propre = nom.trim();
    if (!propre || propre === dossier.nom) return;
    renommer.mutate({ id: dossier.id, nom: propre }, { onError: echec });
  };
  return (
    <Input
      aria-label="Nom du dossier"
      defaultValue={dossier.nom}
      maxLength={60}
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => valider(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") dossierRenomme.set(null);
      }}
      className="h-7 flex-1 px-2 font-medium"
    />
  );
}

/** Le menu ⋯ d'un dossier : y créer une routine, le renommer, le supprimer. */
function FolderMenu({ dossier }: { dossier: Dossier }) {
  const navigate = useNavigate();
  const supprimer = useSupprimerDossier();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`Actions du dossier ${dossier.nom}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onSelect={() =>
            navigate({ to: "/routines/new", search: (p) => ({ ...p, dossier: dossier.id }) })
          }
        >
          <Plus /> Nouvelle routine ici
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => dossierRenomme.set(dossier.id)}>
          <Pencil /> Renommer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() =>
            supprimer(
              dossier.id,
              `Dossier « ${dossier.nom} » supprimé, ses routines sont « Sans dossier »`,
            )
          }
        >
          <Trash2 /> Supprimer le dossier
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Un dossier : sa tête (replier, nombre, menu ⋯) et ses routines. Tout le dossier, tête comprise
 * et même replié, reçoit une routine glissée (D257).
 */
function FolderSection({
  dossier,
  routines,
  open,
  onToggle,
}: {
  dossier: Dossier | null;
  routines: RoutineResume[];
  open: boolean;
  onToggle: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId(dossier) });
  const renaming = dossierRenomme.use() === dossier?.id && dossier !== null;
  const name = dossier?.nom ?? "Sans dossier";
  return (
    <section
      ref={setNodeRef}
      aria-label={name}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl transition-shadow",
        isOver && "ring-2 ring-foreground/40 ring-offset-4 ring-offset-background",
      )}
    >
      <div className="flex h-8 items-center gap-1">
        {renaming && dossier ? (
          <FolderNameInput dossier={dossier} />
        ) : (
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="-ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-1 text-left font-medium text-sm transition-colors hover:bg-muted/60"
          >
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
            <span className={cn("truncate", !dossier && "text-muted-foreground")}>{name}</span>
            <span className="text-muted-foreground tabular-nums">{routines.length}</span>
          </button>
        )}
        {dossier && !renaming && <FolderMenu dossier={dossier} />}
      </div>
      {open &&
        (routines.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-5 text-center text-muted-foreground text-sm">
            Glissez une routine ici
          </div>
        ) : (
          // Une carte par routine, séparées (D258).
          <div className="flex flex-col gap-2">
            {routines.map((r) => (
              <RoutineRow key={r.id} routine={r} />
            ))}
          </div>
        ))}
    </section>
  );
}

/**
 * Les routines rangées par dossier (D257) : des sections repliables, une recherche qui ne montre
 * que les dossiers ayant un résultat (dépliés), et la poignée de chaque ligne pour changer une
 * routine de dossier. Ses quatre états viennent de `GET /routines` (D303).
 */
export function RoutineList() {
  const force = useEtat();
  const requete = useQuery(routinesQuery());
  const [query, setQuery] = useState("");
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set());
  const [dragged, setDragged] = useState<RoutineResume | null>(null);
  const deplacer = useDeplacerRoutine();
  const creating = useRouterState({ select: (s) => s.location.pathname.endsWith("/routines/new") });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const routines = requete.data?.routines ?? [];
  const dossiers = requete.data?.dossiers ?? [];
  const etat = etatAffiche(force, requete, routines.length === 0 && dossiers.length === 0);
  if (etat === "chargement") return <RoutineListSkeleton />;
  if (etat === "erreur")
    return (
      <StateError
        title="Les routines n'ont pas pu se charger"
        reessayer={() => void requete.refetch()}
      />
    );
  if (etat === "vide")
    return (
      <>
        {creating && <DraftRoutineRow />}
        <RoutineListEmpty />
      </>
    );

  const searching = query.trim() !== "";
  const groups = parDossier(
    routines.filter((r) => correspond(r, query)),
    dossiers,
  ).filter((g) => !searching || g.routines.length > 0);

  function onDragEnd({ active, over }: DragEndEvent) {
    setDragged(null);
    const target = over?.id;
    if (typeof target !== "string" || !target.startsWith("dossier:")) return;
    const cible = target.slice("dossier:".length);
    const dossierId = cible === "-" ? null : cible;
    const routine = routines.find((r) => r.id === active.id);
    if (!routine || routine.dossierId === dossierId) return;
    const avant = routine.dossierId;
    const nom = dossiers.find((d) => d.id === dossierId)?.nom ?? "Sans dossier";
    deplacer.mutate(
      { id: routine.id, dossierId },
      {
        onSuccess: () =>
          toast.success(`« ${routine.nom} » rangée dans « ${nom} »`, {
            id: "routine-rangee",
            action: {
              label: "Annuler",
              onClick: () => deplacer.mutate({ id: routine.id, dossierId: avant }),
            },
          }),
        onError: echec,
      },
    );
  }

  return (
    <>
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

      {creating && <DraftRoutineRow />}

      {searching && groups.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucune routine ne correspond</EmptyTitle>
            <EmptyDescription>Essayez un autre mot.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setDragged(routines.find((r) => r.id === active.id) ?? null)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragged(null)}
        >
          <div className="flex flex-col gap-5">
            {groups.map((g) => {
              const cle = g.dossier?.id ?? "-";
              return (
                <FolderSection
                  key={cle}
                  dossier={g.dossier}
                  routines={g.routines}
                  open={searching || !closed.has(cle)}
                  onToggle={() =>
                    setClosed((c) => {
                      const next = new Set(c);
                      if (next.has(cle)) next.delete(cle);
                      else next.add(cle);
                      return next;
                    })
                  }
                />
              );
            })}
          </div>
          <DragOverlay>{dragged && <RoutineRowPreview routine={dragged} />}</DragOverlay>
        </DndContext>
      )}
    </>
  );
}

/** La liste pendant le chargement : la recherche, puis deux dossiers et leurs cartes. */
function RoutineListSkeleton() {
  return (
    <>
      <Skeleton className="h-9 rounded-lg" />
      {[3, 1].map((count, f) => (
        <div key={f} className="flex flex-col gap-2">
          <Skeleton className="my-1 h-5 w-36 rounded" />
          {Array.from({ length: count }, (_, i) => (
            <Skeleton key={i} className="h-15.5 rounded-xl" />
          ))}
        </div>
      ))}
    </>
  );
}

/** Aucune routine : la liste le dit d'une ligne, le panneau de droite guide la création (D260). */
function RoutineListEmpty() {
  return (
    <p className="rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
      Aucune routine pour l'instant.
    </p>
  );
}
