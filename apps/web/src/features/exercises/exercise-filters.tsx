import { CIBLES, EQUIPEMENTS, EQUIPEMENTS_PRINCIPAUX } from "@better-lift/shared";
import { cn } from "cn";
import { ArrowDownUp, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Les 8 muscles les plus fournis en pastilles ; les 11 autres derrière « + 11 » (D200). */
const VISIBLE_TARGETS = CIBLES.slice(0, 8);
const OTHER_TARGETS = CIBLES.slice(8);
const OTHER_EQUIPMENT = EQUIPEMENTS.filter(
  (e) => !(EQUIPEMENTS_PRINCIPAUX as readonly string[]).includes(e),
);
const ALL = "__all__";

export type Sort = "relevance" | "count" | "name";

/**
 * Les trois tris (D210). « Pertinence » est le défaut : tes exercices en tête, les plus
 * récents d'abord, puis un catalogue varié (ou, en recherche, les noms qui commencent par la
 * saisie). Le sens de chaque tri est dans son libellé et sa description.
 */
const SORTS: { value: Sort; label: string; hint: string }[] = [
  { value: "relevance", label: "Pertinence", hint: "Tes exercices récents d'abord" },
  { value: "count", label: "Plus pratiqués", hint: "Le plus de séances d'abord" },
  { value: "name", label: "Nom (A → Z)", hint: "Ordre alphabétique" },
];

type Props = {
  /** Une fiche est ouverte : le panneau est étroit, les pastilles deviennent deux menus (D206). */
  compact?: boolean;
  q: string;
  target?: string;
  equipment?: string;
  mine: boolean;
  /** Le nombre d'exercices pratiqués, pour l'onglet ; `undefined` tant qu'il charge. */
  mineCount?: number;
  sort: Sort;
  onSearch: (q: string) => void;
  onTarget: (target?: string) => void;
  onEquipment: (equipment?: string) => void;
  /** Retire muscle et équipement d'une seule navigation. */
  onClearFilters: () => void;
  onMine: (mine: boolean) => void;
  onSort: (sort: Sort) => void;
};

/**
 * Les filtres de la grille (D211). Deux onglets choisissent l'ensemble — tout le catalogue ou
 * tes exercices —, une barre porte la recherche, le bouton « Filtres » et le tri. Muscle et
 * équipement, secondaires, vivent dans un panneau replié ; un filtre actif reste visible en
 * pastille qu'on retire d'un clic, et le bouton en donne le nombre.
 */
export function ExerciseFilters(props: Props) {
  const { q, target, equipment, mine, sort } = props;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = [
    target ? { key: "target", label: target, clear: () => props.onTarget(undefined) } : null,
    equipment
      ? { key: "equipment", label: equipment, clear: () => props.onEquipment(undefined) }
      : null,
  ].filter((f) => f !== null);

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={mine ? "mine" : "all"} onValueChange={(v) => props.onMine(v === "mine")}>
        <TabsList className="h-10! [&>*]:px-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="mine">
            Mes exercices
            {props.mineCount !== undefined ? (
              <span className="font-medium opacity-70">{props.mineCount}</span>
            ) : null}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        {/* Panneau étroit : la recherche prend sa ligne, filtres et tri se partagent la suivante. */}
        <div className={cn("relative", props.compact ? "basis-full" : "min-w-48 flex-1")}>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Rechercher un exercice"
            placeholder={mine ? "Rechercher dans tes exercices…" : "Rechercher un exercice…"}
            value={q}
            onChange={(e) => props.onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          // Ouvert, il s'enfonce dans son ombre comme la carte ouverte : un état, pas l'orange.
          className="aria-expanded:translate-x-boxShadowX aria-expanded:translate-y-boxShadowY aria-expanded:bg-muted aria-expanded:shadow-none"
        >
          <SlidersHorizontal aria-hidden="true" />
          Filtres
          {active.length ? (
            <span className="rounded-[3px] bg-foreground px-1.5 text-xs leading-5 text-background">
              {active.length}
            </span>
          ) : null}
        </Button>
        <Select value={sort} onValueChange={(v) => props.onSort(v as Sort)}>
          <SelectTrigger aria-label="Trier par">
            <ArrowDownUp aria-hidden="true" className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              {SORTS.map((s) => {
                // Dans « Mes exercices », la pertinence n'est que la date : on le dit.
                const label = mine && s.value === "relevance" ? "Fait récemment" : s.label;
                const hint =
                  mine && s.value === "relevance" ? "La dernière séance d'abord" : s.hint;
                return (
                  <SelectItem key={s.value} value={s.value} textValue={label}>
                    <span className="flex flex-col">
                      <span>{label}</span>
                      <span className="text-xs font-medium text-muted-foreground in-data-[slot=select-value]:hidden">
                        {hint}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {open ? (
        <div
          id={panelId}
          className="flex flex-col gap-3 rounded-base border-2 border-border bg-secondary-background p-3"
        >
          {props.compact ? (
            <div className="grid grid-cols-2 gap-2">
              <FilterSelect
                label="Muscle"
                value={target}
                options={CIBLES}
                onChange={props.onTarget}
              />
              <FilterSelect
                label="Équipement"
                value={equipment}
                options={EQUIPEMENTS}
                onChange={props.onEquipment}
              />
            </div>
          ) : (
            <>
              <FilterRow
                label="Muscle"
                value={target}
                visible={VISIBLE_TARGETS}
                others={OTHER_TARGETS}
                othersLabel={`+ ${OTHER_TARGETS.length}`}
                onChange={props.onTarget}
              />
              <FilterRow
                label="Équipement"
                value={equipment}
                visible={EQUIPEMENTS_PRINCIPAUX}
                others={OTHER_EQUIPMENT}
                othersLabel="Autres"
                onChange={props.onEquipment}
              />
            </>
          )}
        </div>
      ) : null}

      {active.length && !open ? (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Filtres actifs">
          {active.map((f) => (
            <li key={f.key}>
              <Button
                variant="secondary"
                size="sm"
                onClick={f.clear}
                aria-label={`Retirer le filtre ${f.label}`}
                className="bg-muted"
              >
                {f.label}
                <X data-icon="inline-end" aria-hidden="true" />
              </Button>
            </li>
          ))}
          {active.length > 1 ? (
            <li>
              <Button variant="link" size="sm" className="px-1" onClick={props.onClearFilters}>
                Tout effacer
              </Button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

/** Le même filtre en menu déroulant, pour le panneau étroit. */
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: readonly string[];
  onChange: (value?: string) => void;
}) {
  return (
    // Sans choix, la valeur vide montre le seul nom du filtre : « Équipement : tous » ne
    // tenait pas dans le panneau étroit.
    <Select value={value ?? ""} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectGroup>
          <SelectItem value={ALL}>{label} : tous</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Une rangée de pastilles à choix unique, « Tous » en tête, le reste dans un menu. */
function FilterRow({
  label,
  value,
  visible,
  others,
  othersLabel,
  onChange,
}: {
  label: string;
  value?: string;
  visible: readonly string[];
  others: readonly string[];
  othersLabel: string;
  onChange: (value?: string) => void;
}) {
  // Un choix pris dans le menu s'affiche en pastille active à la suite des autres.
  const chosenOther = value && others.includes(value) ? value : null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
      {/* `contents` : les pastilles et le menu partagent la même rangée qui passe à la ligne. */}
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={2}
          value={value ?? ALL}
          // Recliquer la pastille active ne la désactive pas : « Tous » est là pour ça.
          onValueChange={(v) => v && onChange(v === ALL ? undefined : v)}
          aria-label={label}
          className="contents"
        >
          <ToggleGroupItem value={ALL}>Tous</ToggleGroupItem>
          {visible.map((v) => (
            <ToggleGroupItem key={v} value={v}>
              {v}
            </ToggleGroupItem>
          ))}
          {chosenOther ? (
            <ToggleGroupItem value={chosenOther}>{chosenOther}</ToggleGroupItem>
          ) : null}
        </ToggleGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              {othersLabel}
              <ChevronDown data-icon="inline-end" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80">
            <DropdownMenuGroup>
              {others.map((o) => (
                <DropdownMenuItem key={o} onSelect={() => onChange(o)}>
                  {o}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
