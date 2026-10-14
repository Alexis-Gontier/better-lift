import type { ExerciceBrouillon, RoleRepos } from "@better-lift/shared";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Ellipsis, GripVertical, Link2, Timer, Trash2, Unlink2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exerciseOptions } from "@/features/exercises/queries";
import { SetsTable } from "./sets-table";

/** Les repos proposés, en secondes ; « "" » = pas de repos. */
const REST = ["", "30", "45", "60", "90", "120", "150", "180", "240", "300"];

/** « 2:00 », « 1:30 » : la lecture d'un chrono. */
const chronological = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
/** D149 : le dernier d'un superset porte le repos de tout le groupe. */
const restLabel = (t: string, group = false) => {
  const after = group ? " après le groupe" : "";
  return t === "" ? `Sans repos${after}` : `Repos${after} ${chronological(Number(t))}`;
};

export function ExerciseCard({
  exercise,
  rest,
  canLink,
  inGroup,
  onLink,
  onUnlink,
  onChange,
  onRemove,
}: {
  exercise: ExerciceBrouillon;
  /** D149 : masqué sur un membre non dernier d'un superset. */
  rest: RoleRepos;
  /** D152 : hors groupe ou au bout d'un groupe, et pas sur le dernier exercice. */
  canLink: boolean;
  inGroup: boolean;
  onLink: () => void;
  onUnlink: () => void;
  onChange: (e: ExerciceBrouillon) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.cle });
  // Image, groupe et équipement viennent du catalogue, en cache : la routine ne
  // les stocke pas.
  const detail = useQuery(exerciseOptions(exercise.slug));
  // Un repos saisi hors de la liste proposée reste choisi et affiché.
  const choice = REST.includes(exercise.repos) ? REST : [...REST, exercise.repos];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // Pendant le glisser, la carte se SOULÈVE : son ombre dure double, et
      // reprend sa taille en se posant (D193).
      className={`relative flex overflow-hidden rounded-base border-2 border-border bg-card ${
        isDragging ? "z-10 shadow-[8px_8px_0_0_var(--border)]" : "shadow-shadow"
      }`}
    >
      {/* La poignée est une bande sur toute la hauteur, à gauche : visible, facile
          à saisir. Elle seule déclenche le glisser : les champs restent cliquables.
          Au clavier : Espace pour saisir, flèches, Espace pour poser. */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Déplacer ${exercise.nom}`}
        className="grid w-7 shrink-0 cursor-grab place-items-center border-r-2 border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>

      {/* Le contenu à droite de la bande de préhension, sur toute sa hauteur. */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b-2 border-border px-4 py-3">
          {/* La vignette dans le cadre de la grille des exercices (D200). */}
          <span className="size-14 shrink-0 overflow-hidden rounded-base border-2 border-border bg-image-bg">
            {detail.data?.image ? (
              <img
                src={detail.data.image}
                alt=""
                width={56}
                height={56}
                className="size-full object-contain"
              />
            ) : null}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {/* Le nom mène à la fiche : son analyse et ses consignes. */}
            <Link
              to="/exercises/$slug"
              params={{ slug: exercise.slug }}
              className="truncate text-lg leading-tight font-bold underline-offset-2 outline-none hover:underline focus-visible:underline"
            >
              {exercise.nom}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {detail.data ? `${detail.data.cible} · ${detail.data.equipement}` : " "}
            </p>
          </div>

          {rest === "masque" ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  aria-label={`${restLabel(exercise.repos, rest === "groupe")}, modifier`}
                >
                  <Timer aria-hidden="true" />
                  {restLabel(exercise.repos, rest === "groupe")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuLabel className="text-muted-foreground">
                  Repos entre les séries
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={exercise.repos}
                  onValueChange={(rest) => onChange({ ...exercise, repos: rest })}
                >
                  {choice.map((r) => (
                    <DropdownMenuRadioItem key={r} value={r} className="text-xs">
                      {r === "" ? "Sans repos" : chronological(Number(r))}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label={`Actions pour ${exercise.nom}`}>
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onLink} disabled={!canLink}>
                <Link2 aria-hidden="true" />
                Superset avec le suivant
              </DropdownMenuItem>
              {inGroup ? (
                <DropdownMenuItem onSelect={onUnlink}>
                  <Unlink2 aria-hidden="true" />
                  Retirer du superset
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onRemove} className="text-destructive-ink">
                <Trash2 aria-hidden="true" />
                Retirer l'exercice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SetsTable
          exerciseName={exercise.nom}
          series={exercise.series}
          onChange={(sets) => onChange({ ...exercise, series: sets })}
        />
      </div>
    </li>
  );
}
