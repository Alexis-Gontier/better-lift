"use client";

import { ChevronDownIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import { useExercises } from "@better-lift/api-client";
import { Alert, AlertDescription } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Checkbox } from "@better-lift/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@better-lift/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@better-lift/ui/components/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@better-lift/ui/components/input-group";
import { Skeleton } from "@better-lift/ui/components/skeleton";
import { Spinner } from "@better-lift/ui/components/spinner";
import { Switch } from "@better-lift/ui/components/switch";
import { cn } from "@better-lift/ui/lib/utils";
import { type BodyPart, bodyPartSchema, type ExerciseSummary } from "@better-lift/validators";

import { ExerciseMedia } from "./exercise-media";
import { BODY_PART_LABELS, EQUIPMENT_FILTERS, equipmentLabel } from "./labels";
import { pushRecentExercises, readRecentExercises } from "./recent-exercises";
import { useDebouncedValue } from "./use-debounced-value";
import { useProfileLocale } from "@/features/account/use-profile-locale";
import { apiClient } from "@/lib/api";

const SEARCH_DEBOUNCE_MS = 250;
const SKELETON_COUNT = 6;

/**
 * Choix d'exercices, partagé par l'éditeur de routines et celui d'une séance
 * passée (doc 05). Il vit dans le domaine « exercices » et non dans l'un des
 * deux appelants : choisir un exercice est la même question des deux côtés, et
 * la copie aurait divergé au premier filtre ajouté.
 *
 * ## Un dialogue à sélection multiple
 *
 * La première version était une colonne de 20 rem toujours affichée, au motif
 * qu'« on ajoute rarement un seul exercice ». Le raisonnement était juste ;
 * c'est la conclusion qui l'était moins — la colonne prenait 20 rem en
 * permanence à l'écran qui en a le plus besoin.
 *
 * La sélection multiple règle le problème d'origine sans le prix : on ouvre une
 * fois, on coche six exercices, on valide. Un aller-retour au lieu de six, et
 * un seul clic d'ajout au lieu de six.
 *
 * ## Ce que la mise en page cherche à obtenir
 *
 * - **Deux colonnes de cartes** plutôt qu'une liste : un catalogue de 1 324
 *   entrées se parcourt du regard, et deux colonnes divisent par deux la
 *   hauteur à balayer sans rien coûter en lisibilité — le nom tient sur une
 *   ligne, la provenance sur une seconde.
 * - **Une section « récemment utilisés »** en tête. C'est le raccourci qui
 *   compte : on construit un programme sur les mêmes vingt mouvements, et les
 *   retrouver en haut évite de retaper « développé » à chaque routine.
 * - **Filtres repliés dans des menus.** Les onze parties du corps étalées en
 *   pastilles mangeaient deux lignes avant le premier résultat. En menu, elles
 *   ne coûtent qu'un bouton, et le nombre de filtres actifs s'y lit.
 * - **Un pied fixe et non une barre flottante.** Le compte et les deux actions
 *   sont toujours à la même place, et ne masquent jamais une ligne de la
 *   liste. La barre d'action de Dice UI sert ailleurs — sur les modifications
 *   de l'éditeur, où c'est bien un état passager qu'il faut signaler.
 */
export function ExercisePicker({
  onAdd,
  label = "Ajouter un exercice",
  className,
}: {
  /** Reçoit les exercices retenus, **dans l'ordre où ils ont été cochés**. */
  onAdd: (exercises: ExerciseSummary[]) => void;
  label?: string;
  /** Appliqué au déclencheur, qui vit dans la mise en page de l'appelant. */
  className?: string;
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [customOnly, setCustomOnly] = useState(false);
  const [recent, setRecent] = useState<ExerciseSummary[]>([]);

  /**
   * Une `Map` et non un `Set` d'identifiants : l'appelant a besoin de
   * l'exercice entier, et le relire dans la liste échouerait pour un exercice
   * coché puis filtré hors de la vue. L'ordre d'insertion d'une `Map` est
   * garanti — c'est l'ordre de cochage, donc celui d'ajout.
   */
  const [selected, setSelected] = useState<Map<string, ExerciseSummary>>(new Map());

  const locale = useProfileLocale();
  const q = useDebouncedValue(draftQuery, SEARCH_DEBOUNCE_MS).trim();

  const query = useMemo(
    () => ({
      ...(q ? { q } : {}),
      ...(bodyParts.length ? { bodyPart: bodyParts } : {}),
      ...(equipment.length ? { equipment } : {}),
      ...(customOnly ? { custom: true } : {}),
      locale,
    }),
    [q, bodyParts, equipment, customOnly, locale],
  );

  const exercises = useExercises(apiClient, query);
  const items = useMemo(
    () => exercises.data?.pages.flatMap((page) => page.data) ?? [],
    [exercises.data],
  );

  /*
    Lu à l'ouverture et non au montage : le dialogue reste monté entre deux
    usages, et une liste figée au premier rendu ne montrerait jamais ce qu'on
    vient d'ajouter. Lire le `localStorage` au rendu casserait par ailleurs
    l'hydratation — le serveur ne le connaît pas.
  */
  useEffect(() => {
    if (open) {
      setRecent(readRecentExercises());
    } else {
      // Une sélection abandonnée ne doit pas ressurgir à la réouverture : on
      // ouvrirait sur six cases déjà cochées sans savoir d'où elles viennent.
      setSelected(new Map());
    }
  }, [open]);

  function toggleExercise(exercise: ExerciseSummary) {
    setSelected((current) => {
      const next = new Map(current);

      if (!next.delete(exercise.id)) {
        next.set(exercise.id, exercise);
      }

      return next;
    });
  }

  function confirm() {
    if (selected.size === 0) {
      return;
    }

    const added = [...selected.values()];

    pushRecentExercises(added);
    onAdd(added);
    setOpen(false);
  }

  /** Les récents que les filtres courants laissent passer, sans doublon. */
  const visibleRecent = useMemo(() => {
    const shown = new Set(items.map((exercise) => exercise.id));

    return recent.filter(
      (exercise) =>
        shown.has(exercise.id) ||
        // Un récent hors des résultats reste montré s'il est **coché** : le
        // retirer de la vue sous prétexte d'un filtre ferait disparaître une
        // case cochée, et le compte du pied cesserait d'être vérifiable.
        selected.has(exercise.id),
    );
  }, [recent, items, selected]);

  const recentIds = new Set(visibleRecent.map((exercise) => exercise.id));
  const results = items.filter((exercise) => !recentIds.has(exercise.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className={className}>
          <PlusIcon />
          {label}
        </Button>
      </DialogTrigger>

      {/*
        `p-0` puis un rembourrage par bande : l'en-tête et le pied portent un
        filet qui doit courir d'un bord à l'autre du dialogue. Avec le `p-6` de
        la primitive, les deux filets s'arrêteraient à 24 px des bords et se
        liraient comme des traits décoratifs plutôt que comme des séparations.
      */}
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Cochez-en autant que nécessaire : ils seront ajoutés dans l’ordre où vous les cochez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
          <InputGroup size="lg">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              id={`${fieldId}-search`}
              type="text"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Rechercher un exercice…"
              autoComplete="off"
              aria-label="Rechercher un exercice"
            />
            {/*
              Effacement explicite plutôt que `type="search"` : la croix native
              de WebKit n'est ni stylable, ni atteignable au clavier, et elle
              n'existe pas du tout sur Firefox.
            */}
            {draftQuery && (
              <InputGroupAddon align="inline-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Effacer la recherche"
                  onClick={() => setDraftQuery("")}
                >
                  <XIcon />
                </Button>
              </InputGroupAddon>
            )}
          </InputGroup>

          <div className="flex flex-wrap items-center gap-2">
            <FilterMenu
              label="Parties du corps"
              options={bodyPartSchema.options.map((value) => ({
                value,
                label: BODY_PART_LABELS[value],
              }))}
              selected={bodyParts}
              onToggle={(value) =>
                setBodyParts((current) =>
                  current.includes(value as BodyPart)
                    ? current.filter((entry) => entry !== value)
                    : [...current, value as BodyPart],
                )
              }
              onClear={() => setBodyParts([])}
            />

            <FilterMenu
              label="Équipement"
              options={EQUIPMENT_FILTERS}
              selected={equipment}
              onToggle={(value) =>
                setEquipment((current) =>
                  current.includes(value)
                    ? current.filter((entry) => entry !== value)
                    : [...current, value],
                )
              }
              onClear={() => setEquipment([])}
            />

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor={`${fieldId}-custom`} className="cursor-pointer text-sm">
                Mes exercices seulement
              </label>
              <Switch
                id={`${fieldId}-custom`}
                checked={customOnly}
                onCheckedChange={setCustomOnly}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {exercises.isPending && (
            <div className="grid gap-2 sm:grid-cols-2" aria-busy>
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <Skeleton key={index} className="h-16 rounded-lg" />
              ))}
            </div>
          )}

          {exercises.isError && (
            <Alert variant="destructive">
              <AlertDescription>{exercises.error.message}</AlertDescription>
            </Alert>
          )}

          {exercises.isSuccess && items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {customOnly
                ? "Vous n’avez pas encore créé d’exercice."
                : "Aucun exercice ne correspond."}
            </p>
          )}

          {visibleRecent.length > 0 && (
            <Section title="Récemment utilisés">
              {visibleRecent.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  checked={selected.has(exercise.id)}
                  onToggle={() => toggleExercise(exercise)}
                  fieldId={`${fieldId}-recent`}
                />
              ))}
            </Section>
          )}

          {results.length > 0 && (
            <Section title={visibleRecent.length > 0 ? "Tous les résultats" : undefined}>
              {results.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  checked={selected.has(exercise.id)}
                  onToggle={() => toggleExercise(exercise)}
                  fieldId={`${fieldId}-all`}
                />
              ))}
            </Section>
          )}

          {exercises.hasNextPage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void exercises.fetchNextPage()}
              disabled={exercises.isFetchingNextPage}
              className="mt-3 w-full"
            >
              {exercises.isFetchingNextPage && <Spinner data-icon="inline-start" />}
              Charger la suite
            </Button>
          )}
        </div>

        <DialogFooter className="items-center border-t border-border px-6 py-4 sm:justify-between">
          {/*
            `aria-live` : le compte change sans qu'aucun focus ne bouge — on
            coche une case au milieu de la liste et le bouton d'ajout change de
            libellé tout en bas. Sans annonce, rien ne le signale.
          */}
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {selected.size === 0
              ? "Aucun exercice sélectionné"
              : `${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`}
          </p>

          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="button" onClick={confirm} disabled={selected.size === 0}>
              {selected.size <= 1 ? "Ajouter l’exercice" : `Ajouter les ${selected.size} exercices`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 last:mb-0">
      {title && (
        <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h3>
      )}
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * Filtre multi-valeurs replié dans un menu.
 *
 * Le compte est écrit sur le déclencheur : replié, un filtre actif est invisible
 * — et un catalogue qui ne rend que trois résultats sans qu'on sache pourquoi
 * est le meilleur moyen de conclure qu'il est cassé.
 */
function FilterMenu({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  selected: readonly string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const active = selected.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn(active && "border-ring")}>
          {label}
          {active && <span className="text-muted-foreground">({selected.length})</span>}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            /*
              Le menu reste ouvert : on coche rarement une seule partie du
              corps, et le refermer à chaque fois obligerait à le rouvrir
              autant de fois qu'on veut de filtres.
            */
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={() => onToggle(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}

        {active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start"
            onClick={onClear}
          >
            Tout décocher
          </Button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Une carte d'exercice cochable.
 *
 * La case et le libellé sont associés par `htmlFor`, jamais par enveloppement :
 * `Checkbox` de Radix rend un `<button role="checkbox">` et non un `<input>`,
 * et un `<label>` qui l'entoure ne le bascule pas. Un `<button>` étant un
 * élément étiquetable, l'association explicite fonctionne — et le libellé
 * redevient la cible cliquable de toute la carte.
 */
function ExerciseCard({
  exercise,
  checked,
  onToggle,
  fieldId,
}: {
  exercise: ExerciseSummary;
  checked: boolean;
  onToggle: () => void;
  fieldId: string;
}) {
  const id = `${fieldId}-${exercise.id}`;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        "has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-offset-2 has-[button:focus-visible]:outline-ring",
        // La bordure porte l'état retenu, pas seulement la case : sur deux
        // colonnes, une case cochée au fond d'une carte se repère mal.
        checked ? "border-foreground bg-accent" : "border-border hover:bg-accent/50",
      )}
    >
      {/*
        `ExerciseMedia` et non une pastille écrite ici : c'est lui qui sait
        qu'aucun média n'est servi tant que `MEDIA_BASE_URL` est vide (doc 08),
        et qui bascule sur l'initiale. Une seconde implémentation du repli
        aurait divergé le jour où le CDN arrive.
      */}
      <ExerciseMedia
        url={exercise.thumbnailUrl}
        name={exercise.name}
        className="size-10 shrink-0 rounded-md"
      />

      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col">
        <span className="truncate text-sm font-medium">{exercise.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {exercise.isCustom ? "Personnalisé · " : ""}
          {BODY_PART_LABELS[exercise.bodyPart]} · {equipmentLabel(exercise.equipment)}
        </span>
      </label>

      <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
