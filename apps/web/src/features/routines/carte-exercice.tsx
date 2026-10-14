import { type ExerciceBrouillon, LIBELLE_GROUPE, type RoleRepos } from "@better-lift/shared";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
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
import { formaterSerie } from "@/features/exercices/badge-record";
import { optionsExercice } from "@/features/exercices/requetes";
import { TableauSeries } from "./tableau-series";

/** Les repos proposés, en secondes ; « "" » = pas de repos. */
const REPOS = ["", "30", "45", "60", "90", "120", "150", "180", "240", "300"];

/** « 2:00 », « 1:30 » : la lecture d'un chrono. */
const enChrono = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
/** D149 : le dernier d'un superset porte le repos de tout le groupe. */
const libelleRepos = (t: string, groupe = false) => {
  const apres = groupe ? " après le groupe" : "";
  return t === "" ? `Sans repos${apres}` : `Repos${apres} ${enChrono(Number(t))}`;
};

export function CarteExercice({
  exercice,
  derniere,
  repos,
  peutLier,
  dansGroupe,
  onLier,
  onDelier,
  onChange,
  onRetirer,
}: {
  exercice: ExerciceBrouillon;
  /** D149 : masqué sur un membre non dernier d'un superset. */
  repos: RoleRepos;
  /** D152 : hors groupe ou au bout d'un groupe, et pas sur le dernier exercice. */
  peutLier: boolean;
  dansGroupe: boolean;
  onLier: () => void;
  onDelier: () => void;
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
        aria-label={`Déplacer ${exercice.nom}`}
        className="grid w-7 shrink-0 cursor-grab place-items-center border-r border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:cursor-grabbing"
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
              className="size-12 shrink-0 rounded-[10px] bg-image-bg object-contain"
            />
          ) : (
            <span aria-hidden="true" className="size-12 shrink-0 rounded-[10px] bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{exercice.nom}</p>
            <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
              {fiche.data ? `${LIBELLE_GROUPE[fiche.data.groupe]} · ${fiche.data.equipement}` : " "}
              {derniere
                ? ` · dernière fois : ${formaterSerie(derniere.chargeKg, derniere.reps)}`
                : ""}
            </p>
          </div>

          {repos === "masque" ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  aria-label={`${libelleRepos(exercice.repos, repos === "groupe")}, modifier`}
                >
                  <Timer aria-hidden="true" />
                  {libelleRepos(exercice.repos, repos === "groupe")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuLabel className="text-muted-foreground">
                  Repos entre les séries
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={exercice.repos}
                  onValueChange={(repos) => onChange({ ...exercice, repos })}
                >
                  {choix.map((r) => (
                    <DropdownMenuRadioItem key={r} value={r} className="text-xs">
                      {r === "" ? "Sans repos" : enChrono(Number(r))}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                aria-label={`Actions pour ${exercice.nom}`}
              >
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onLier} disabled={!peutLier}>
                <Link2 aria-hidden="true" />
                Superset avec le suivant
              </DropdownMenuItem>
              {dansGroupe ? (
                <DropdownMenuItem onSelect={onDelier}>
                  <Unlink2 aria-hidden="true" />
                  Retirer du superset
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
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
