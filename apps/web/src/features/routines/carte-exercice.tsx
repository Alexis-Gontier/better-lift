import { LIBELLE_GROUPE } from "@better-lift/shared";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { Ellipsis, GripVertical, Timer, Trash2 } from "lucide-react";
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
import { formaterSerie } from "@/features/exercices/badge-record";
import { optionsExercice } from "@/features/exercices/requetes";
import type { ExerciceBrouillon } from "./brouillon";
import { TableauSeries } from "./tableau-series";

/** Les repos proposés, en secondes ; « "" » = pas de repos. */
const REPOS = ["", "30", "45", "60", "90", "120", "150", "180", "240", "300"];

/** « 2:00 », « 1:30 » : la lecture d'un chrono. */
const enChrono = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const libelleRepos = (t: string) => (t === "" ? "Sans repos" : `Repos ${enChrono(Number(t))}`);

export function CarteExercice({
  exercice,
  derniere,
  onChange,
  onRetirer,
}: {
  exercice: ExerciceBrouillon;
  /** La meilleure série de la dernière fois, s'il y en a une (D67). */
  derniere: { reps: number | null; chargeKg: number | null } | null;
  onChange: (e: ExerciceBrouillon) => void;
  onRetirer: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercice.cle });
  // Image, groupe et équipement viennent du catalogue, en cache : la routine ne
  // les stocke pas.
  const fiche = useQuery(optionsExercice(exercice.slug));
  // Un repos saisi hors de la liste proposée reste choisi et affiché.
  const choix = REPOS.includes(exercice.repos) ? REPOS : [...REPOS, exercice.repos];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // Pendant le glisser, la carte FLOTTE : elle gagne l'ombre que la doctrine
      // réserve au passager, et la perd en se posant.
      className={`relative flex overflow-hidden rounded-xl border border-(--line) bg-(--surface-2) ${
        isDragging ? "z-10 shadow-lg" : ""
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
        aria-label={`Déplacer ${exercice.nom}`}
        className="grid w-7 shrink-0 cursor-grab place-items-center border-r border-(--line) text-(--ink-faint) hover:bg-(--surface-3) hover:text-(--ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--focus-ring) active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>

      {/* Le contenu à droite de la bande de préhension, sur toute sa hauteur. */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          {fiche.data?.image ? (
            <img
              src={fiche.data.image}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-lg bg-white object-contain"
            />
          ) : (
            <span aria-hidden="true" className="size-12 shrink-0 rounded-lg bg-(--surface-3)" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-(--ink)">{exercice.nom}</p>
            <p className="mt-0.5 truncate font-mono text-[11.5px] text-(--ink-faint)">
              {fiche.data ? `${LIBELLE_GROUPE[fiche.data.groupe]} · ${fiche.data.equipement}` : " "}
              {derniere
                ? ` · dernière fois : ${formaterSerie(derniere.chargeKg, derniere.reps)}`
                : ""}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full font-mono text-xs"
                aria-label={`${libelleRepos(exercice.repos)}, modifier`}
              >
                <Timer aria-hidden="true" />
                {libelleRepos(exercice.repos)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuLabel className="text-(--ink-subtle)">
                Repos entre les séries
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={exercice.repos}
                onValueChange={(repos) => onChange({ ...exercice, repos })}
              >
                {choix.map((r) => (
                  <DropdownMenuRadioItem key={r} value={r} className="font-mono text-xs">
                    {r === "" ? "Sans repos" : enChrono(Number(r))}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-(--ink-subtle)"
                aria-label={`Actions pour ${exercice.nom}`}
              >
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onRetirer} className="text-destructive-ink">
                <Trash2 aria-hidden="true" />
                Retirer l'exercice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TableauSeries
          nomExercice={exercice.nom}
          series={exercice.series}
          onChange={(series) => onChange({ ...exercice, series })}
        />
      </div>
    </li>
  );
}
