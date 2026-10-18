import {
  type Brouillon,
  type ExerciceBrouillon,
  type ExerciceResume,
  lierAuSuivant,
  normaliserGroupes,
  nouvelExercice,
  peutLierAuSuivant,
  retirerDuGroupe,
  roleRepos,
  type SerieBrouillon,
  type TypeSerie,
} from "@better-lift/shared";
import {
  ArrowDown,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  GripVertical,
  History,
  Info,
  Link2,
  Minus,
  MoreHorizontal,
  Plus,
  Timer,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import { useState } from "react";
import { ExerciseThumb } from "@/components/exercise-media";
import { ExerciseQuickView } from "@/components/exercise-quick-view";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/reui/sortable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatLoad, formatRest, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ExercisePicker } from "./exercise-picker";
import type { InfoExercice } from "./infos";
import {
  type ChangeSummary,
  copyFirstToAll,
  fromLastTime,
  SET_TYPES,
  type SeriePrecedente,
  setLabels,
  setsSummary,
  setTone,
  supersetLetter,
} from "./routine-draft";

type OnChange = (update: (d: Brouillon) => Brouillon) => void;

/**
 * La marque d'un champ modifiable dans l'éditeur (D250) : un fond teinté, sans contour. On voit
 * d'emblée ce qui se modifie, sans le mur de bordures ; le focus pose l'anneau.
 */
export const filled =
  "border-transparent bg-muted/70 shadow-none hover:bg-muted dark:bg-input/70 dark:hover:bg-input";

/** Radix refuse une valeur vide : le repos par défaut du compte passe par une clé. */
const DEFAULT_REST = "defaut";

/** Les repos proposés ; la valeur de la routine s'y ajoute si elle n'y est pas. */
const RESTS = [0, 30, 45, 60, 75, 90, 105, 120, 150, 180, 240, 300];

/** Les colonnes d'une ligne de série : type, dernière fois, charge, répétitions, retrait. */
// « Dernière fois » a une largeur fixe : les champs restent près de l'étiquette de série. Carte
// trop étroite pour la loger, elle s'efface et les champs gardent leur place.
const SET_GRID =
  "grid grid-cols-[2.25rem_8.5rem_8.5rem_1.75rem] items-center gap-3 @[31rem]/sets:grid-cols-[2.25rem_6.5rem_8.5rem_8.5rem_1.75rem]";
const LAST_TIME_COL = "hidden @[31rem]/sets:block";

/** « 25 kg × 15 » : la série de même rang à la dernière séance, ou la dernière connue. */
function lastTime(precedentes: readonly SeriePrecedente[] | undefined, i: number): string {
  const p = precedentes?.[i] ?? precedentes?.at(-1);
  return p ? `${formatLoad(p.chargeKg)} × ${p.reps ?? "—"}` : "—";
}

/** Les bornes de la saisie, celles de `routineSaisie` dans `shared` : l'API refuserait au-delà. */
const LIMITS = { sets: 20, exercises: 50, kg: 1000, reps: 999, name: 120 } as const;

/** Le pas suivant, sans dérive des flottants (2,5 + 2,5 + 2,5…) ni sortie des bornes. */
export function stepValue(value: string, delta: number, min: number, max = Infinity): string {
  const n = value.trim() === "" ? (delta > 0 ? 0 : min) : Number(value);
  if (Number.isNaN(n)) return value;
  return String(Math.min(max, Math.max(min, Math.round((n + delta) * 100) / 100)));
}

/** Une valeur de série : − / + autour du champ, l'unité à côté du nombre (D246). */
export function SetField({
  value,
  unit,
  label,
  step,
  min,
  max,
  onChange,
}: {
  value: string;
  unit: string;
  label: string;
  step: number;
  min: number;
  max: number;
  onChange: (value: string) => void;
}) {
  // Une saisie hors bornes est ramenée dedans : 1200 kg devient 1000.
  const clamp = (v: string) =>
    v.trim() === "" || Number.isNaN(Number(v))
      ? v
      : String(Math.min(max, Math.max(min, Number(v))));
  return (
    <InputGroup className={cn("w-34", filled)}>
      <InputGroupAddon>
        <InputGroupButton
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={`Moins : ${label}`}
          onClick={() => onChange(stepValue(value, -step, min, max))}
        >
          <Minus />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        placeholder="—"
        aria-label={label}
        // Sans les flèches natives : les boutons − / + les remplacent.
        className="text-center font-medium tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        onChange={(e) => onChange(clamp(e.target.value))}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{unit}</InputGroupText>
        <InputGroupButton
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={`Plus : ${label}`}
          onClick={() => onChange(stepValue(value, step, min, max))}
        >
          <Plus />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

/** Une étiquette de série dans sa case, en couleur selon son type (W, 1, F, D). */
export function SetBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md border font-semibold text-sm tabular-nums",
        tone,
      )}
    >
      {label}
    </span>
  );
}

/** Le type d'une série, choisi sur son étiquette, comme dans Hevy (D248, D249). */
function SetTypeButton({
  set,
  label,
  index,
  onChange,
}: {
  set: SerieBrouillon;
  label: string;
  index: number;
  onChange: (type: TypeSerie) => void;
}) {
  const typeName = SET_TYPES.find((t) => t.value === set.type)?.label ?? "Normale";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label={`Type de la série ${index + 1} : ${typeName}`}
          className={cn("font-semibold tabular-nums", setTone(set.type))}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {SET_TYPES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            className="gap-3 py-1.5"
            onSelect={() => onChange(t.value)}
          >
            {/* La série normale montre son numéro réel, comme dans Hevy. */}
            <SetBadge label={t.short || (set.type === "NORMALE" ? label : "1")} tone={t.tone} />
            {t.label}
            {t.value === set.type && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Une carte d'exercice de l'éditeur (D246) : la poignée sur toute la hauteur à gauche ; en tête
 * la vignette, le nom, le repos et le menu ⋯ ; un filet ; les séries, face à la dernière fois ;
 * un filet ; *Ajouter une série*. Les champs et les boutons se voient d'emblée : on lit la
 * carte comme un formulaire.
 */
function ExerciseEditor({
  uid,
  exercise,
  info,
  letter,
  precedentes,
  mark,
  chains,
  open,
  onToggle,
  onChange,
  onRemove,
  onLink,
  onUnlink,
  onView,
}: {
  /** Repère la carte dans la page : on y fait défiler après un ajout. */
  uid: string;
  exercise: ExerciceBrouillon;
  /** Ses muscles, une fois connus. */
  info?: InfoExercice;
  /** La lettre de son superset, `null` hors groupe. */
  letter: string | null;
  /** Les séries de la dernière séance qui le contenait. */
  precedentes?: readonly SeriePrecedente[];
  /** Ce que l'exercice a de différent de la routine enregistrée (D261). */
  mark?: "Modifié" | "Nouveau";
  /** Enchaîné au suivant dans un superset : son repos ne compte pas. */
  chains: boolean;
  /** Replié, la carte ne montre que sa tête et le résumé de ses séries (D253). */
  open: boolean;
  onToggle: () => void;
  onChange: (next: ExerciceBrouillon) => void;
  onRemove: () => void;
  /** Absent quand il n'y a pas de suivant à lier. */
  onLink?: () => void;
  onUnlink: () => void;
  /** Ouvre la fiche de l'exercice dans une fenêtre (D262). */
  onView: () => void;
}) {
  const name = exercise.nom;
  const muscle = info?.musclePrincipal ?? "";
  const sets = exercise.series;
  const setAt = (i: number, patch: Partial<SerieBrouillon>) =>
    onChange({ ...exercise, series: sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  // La série ajoutée reprend la dernière, en série normale.
  const last: SerieBrouillon = { ...(sets.at(-1) ?? { reps: "", charge: "" }), type: "NORMALE" };
  const labels = setLabels(sets);
  // Le repos est du texte dans le brouillon : vide, c'est le repos par défaut du compte.
  const rest = /^\d+$/.test(exercise.repos.trim()) ? Number(exercise.repos) : null;
  const rests =
    rest === null || RESTS.includes(rest) ? RESTS : [...RESTS, rest].sort((x, y) => x - y);

  return (
    <Card size="sm" className="flex-row gap-0 py-0" data-exercise={uid}>
      {/* Un vrai bouton : sans focus possible, la poignée ne répondrait pas au clavier. */}
      <SortableItemHandle asChild>
        <button
          type="button"
          aria-label={`Déplacer : ${name}`}
          className="flex w-7 shrink-0 cursor-grab items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      </SortableItemHandle>

      {/* Conteneur : une carte étroite (liste élargie, petit écran) se resserre d'elle-même. */}
      <div className="@container/ex flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 p-3">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? "Replier" : "Déplier"} : ${name}`}
            onClick={onToggle}
            className="-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-muted/50"
          >
            <ChevronRight
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
            <ExerciseThumb name={name} src={exercise.image} className="hidden @[28rem]/ex:flex" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium" title={name}>
                  {name}
                </span>
                {mark && (
                  <Badge variant="outline" className="shrink-0">
                    {mark}
                  </Badge>
                )}
                {letter && (
                  <Badge variant="secondary" className="shrink-0">
                    <Link2 data-icon="inline-start" />
                    Superset {letter}
                  </Badge>
                )}
              </span>
              {/* Replié, le résumé des séries remplace le tableau. */}
              <span className="truncate text-muted-foreground text-xs">
                {open ? muscle : [muscle, setsSummary(sets)].filter(Boolean).join(" · ")}
              </span>
            </span>
          </button>
          {/* Repos et menu vont ensemble : un seul petit écart entre eux. */}
          <div className="flex shrink-0 items-center gap-1.5">
            {chains ? (
              <span className="flex items-center gap-1.5 px-2.5 text-muted-foreground text-sm @[28rem]/ex:w-32">
                <ArrowDown className="size-4" /> Enchaîné
              </span>
            ) : (
              <Select
                value={rest === null ? DEFAULT_REST : String(rest)}
                onValueChange={(v) => onChange({ ...exercise, repos: v === DEFAULT_REST ? "" : v })}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Repos"
                  className={cn("w-auto @[28rem]/ex:w-32", filled)}
                >
                  <Timer className="hidden text-muted-foreground @[28rem]/ex:block" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={DEFAULT_REST}>Repos par défaut</SelectItem>
                    {rests.map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r === 0 ? "Sans repos" : formatRest(r)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label={`Actions : ${name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onSelect={onView}>
                  <Info /> Voir la fiche
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={sets.length < 2}
                  onSelect={() => onChange({ ...exercise, series: copyFirstToAll(sets) })}
                >
                  <Copy /> Même charge partout
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!precedentes?.length}
                  onSelect={() =>
                    onChange({ ...exercise, series: fromLastTime(sets, precedentes) })
                  }
                >
                  <History /> Recopier la dernière fois
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!onLink} onSelect={onLink}>
                  <Link2 /> Superset avec le suivant
                </DropdownMenuItem>
                {letter && (
                  <DropdownMenuItem onSelect={onUnlink}>
                    <Unlink /> Retirer du superset
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onRemove}>
                  <Trash2 /> Retirer l'exercice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {open && (
          <>
            {/* Les filets courent sur toute la largeur de la carte, poignée exceptée. */}
            <Separator />

            <div className="@container/sets flex flex-col gap-1.5 p-3">
              <div className={cn(SET_GRID, "px-1 text-muted-foreground text-xs")}>
                <span>Série</span>
                <span className={LAST_TIME_COL}>Dernière fois</span>
                <span>Charge</span>
                <span>Répétitions</span>
                <span />
              </div>
              {sets.map((set, i) => (
                <div key={i} className={cn(SET_GRID, "rounded-md px-1")}>
                  <SetTypeButton
                    set={set}
                    label={labels[i] ?? String(i + 1)}
                    index={i}
                    onChange={(type) => setAt(i, { type })}
                  />
                  <span
                    className={cn(
                      LAST_TIME_COL,
                      "truncate text-muted-foreground text-sm tabular-nums",
                    )}
                  >
                    {lastTime(precedentes, i)}
                  </span>
                  <SetField
                    label={`Charge de la série ${i + 1}`}
                    unit="kg"
                    step={2.5}
                    min={0}
                    max={LIMITS.kg}
                    // Le brouillon écrit « 82,5 » ; le champ numérique lit « 82.5 ».
                    value={set.charge.replace(",", ".")}
                    onChange={(v) => setAt(i, { charge: v })}
                  />
                  <SetField
                    label={`Répétitions de la série ${i + 1}`}
                    unit="rép."
                    step={1}
                    min={1}
                    max={LIMITS.reps}
                    value={set.reps}
                    onChange={(v) => setAt(i, { reps: v })}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Retirer la série ${i + 1}`}
                    className="text-muted-foreground/70 hover:text-foreground"
                    disabled={sets.length === 1}
                    onClick={() =>
                      onChange({ ...exercise, series: sets.filter((_, j) => j !== i) })
                    }
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="p-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={sets.length >= LIMITS.sets}
                onClick={() => onChange({ ...exercise, series: [...sets, last] })}
              >
                <Plus data-icon="inline-start" />
                {sets.length >= LIMITS.sets ? `${LIMITS.sets} séries au plus` : "Ajouter une série"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/** Le nom de la routine, modifiable dans la tête du panneau (D250) : pas de champ en double. */
export function RoutineNameInput({
  draft,
  onChange,
  autoFocus = false,
}: {
  draft: Brouillon;
  onChange: OnChange;
  autoFocus?: boolean;
}) {
  return (
    <Input
      aria-label="Nom de la routine"
      maxLength={LIMITS.name}
      placeholder="Sans nom"
      autoFocus={autoFocus}
      className={cn(
        "h-11 w-auto min-w-24 max-w-full @2xl:min-w-72 px-2 font-medium text-2xl field-sizing-content md:text-2xl",
        filled,
      )}
      value={draft.nom}
      onChange={(e) => onChange((d) => ({ ...d, nom: e.target.value }))}
    />
  );
}

/**
 * Le corps de l'éditeur : les exercices à réordonner, repliés par défaut (D253). Le nom vit dans
 * la tête du panneau, le dossier et la note dans sa colonne de droite ; le panneau décide quand
 * on enregistre (D243).
 */
export function RoutineFields({
  draft,
  onChange,
  changes,
  infos,
  precedentes,
}: {
  draft: Brouillon;
  onChange: OnChange;
  /** Absent à la création : tout y est nouveau, rien à marquer. */
  changes?: ChangeSummary;
  infos: ReadonlyMap<string, InfoExercice>;
  /** Par slug, les séries de la dernière séance qui le contenait. */
  precedentes?: Readonly<Record<string, readonly SeriePrecedente[]>>;
}) {
  const [picking, setPicking] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const exercices = draft.exercices;
  const room = LIMITS.exercises - exercices.length;
  // Tout est replié à l'ouverture : la routine se lit en un écran. Un exercice ajouté s'ouvre.
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());
  const allOpen = exercices.length > 0 && exercices.every((e) => opened.has(e.cle));
  const toggle = (cle: string) =>
    setOpened((o) => {
      const next = new Set(o);
      if (next.has(cle)) next.delete(cle);
      else next.add(cle);
      return next;
    });

  const setExercise = (i: number, next: ExerciceBrouillon) =>
    onChange((d) => ({ ...d, exercices: d.exercices.map((e, j) => (j === i ? next : e)) }));

  return (
    <>
      {exercices.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            {plural(exercices.length, "exercice")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpened(allOpen ? new Set() : new Set(exercices.map((e) => e.cle)))}
          >
            <ChevronsUpDown data-icon="inline-start" />
            {allOpen ? "Tout replier" : "Tout déplier"}
          </Button>
        </div>
      )}

      {/* Réordonnables à la poignée, à la souris ou au clavier (Espace, flèches, Espace). */}
      <Sortable
        value={exercices}
        // Un glisser peut couper un superset : la normalisation de shared le défait ou le renomme.
        onValueChange={(liste) => onChange((d) => ({ ...d, exercices: normaliserGroupes(liste) }))}
        getItemValue={(e) => e.cle}
        className="flex flex-col gap-3"
      >
        {exercices.map((e, i) => (
          <SortableItem key={e.cle} value={e.cle}>
            <ExerciseEditor
              uid={e.cle}
              exercise={e}
              info={infos.get(e.slug)}
              letter={supersetLetter(exercices, i)}
              precedentes={precedentes?.[e.slug]}
              open={opened.has(e.cle)}
              onToggle={() => toggle(e.cle)}
              onChange={(next) => setExercise(i, next)}
              // Dans un superset, seul le dernier garde son repos : les autres s'enchaînent.
              chains={roleRepos(exercices, i) === "masque"}
              onRemove={() =>
                onChange((d) => ({
                  ...d,
                  exercices: normaliserGroupes(d.exercices.filter((_, j) => j !== i)),
                }))
              }
              onLink={
                peutLierAuSuivant(exercices, i)
                  ? () => onChange((d) => ({ ...d, exercices: lierAuSuivant(d.exercices, i) }))
                  : undefined
              }
              onUnlink={() =>
                onChange((d) => ({ ...d, exercices: retirerDuGroupe(d.exercices, i) }))
              }
              onView={() => setViewing(e.slug)}
              mark={
                changes?.added.has(e.cle)
                  ? "Nouveau"
                  : changes?.changed.has(e.cle)
                    ? "Modifié"
                    : undefined
              }
            />
          </SortableItem>
        ))}
      </Sortable>

      <Button
        variant="outline"
        className="w-full"
        disabled={room <= 0}
        onClick={() => setPicking(true)}
      >
        <Plus data-icon="inline-start" />
        {room <= 0 ? `${LIMITS.exercises} exercices au plus` : "Ajouter des exercices"}
      </Button>

      <ExercisePicker
        open={picking}
        onOpenChange={setPicking}
        present={exercices.map((e) => e.slug)}
        room={room}
        onPick={(choisis: ExerciceResume[]) => {
          // Les exercices ajoutés s'ouvrent : on règle leurs séries dans la foulée.
          const added = choisis.map((e) => nouvelExercice(e.slug, e.nom, e.image));
          setOpened((o) => new Set([...o, ...added.map((e) => e.cle)]));
          onChange((d) => ({ ...d, exercices: [...d.exercices, ...added] }));
          // Ajoutés en bas, hors de vue d'une longue routine : on y descend.
          setTimeout(() =>
            document
              .querySelector(`[data-exercise="${added[0]?.cle}"]`)
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
          );
        }}
      />
      <ExerciseQuickView slug={viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </>
  );
}
