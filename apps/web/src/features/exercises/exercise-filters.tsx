import { CIBLES, EQUIPEMENTS, EQUIPEMENTS_PRINCIPAUX } from "@better-lift/shared";
import { ArrowDownUp, ChevronDown, Search } from "lucide-react";
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
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Les 8 muscles les plus fournis en pastilles ; les 11 autres derrière « + 11 » (D200). */
const VISIBLE_TARGETS = CIBLES.slice(0, 8);
const OTHER_TARGETS = CIBLES.slice(8);
const OTHER_EQUIPMENT = EQUIPEMENTS.filter(
  (e) => !(EQUIPEMENTS_PRINCIPAUX as readonly string[]).includes(e),
);
const ALL = "__all__";

export type Sort = "name" | "recent" | "count";

const SORTS: { value: Sort; label: string }[] = [
  { value: "name", label: "Nom" },
  { value: "recent", label: "Fait récemment" },
  { value: "count", label: "Plus pratiqués" },
];

type Props = {
  /** Une fiche est ouverte : le panneau est étroit, les pastilles deviennent deux menus (D206). */
  compact?: boolean;
  q: string;
  target?: string;
  equipment?: string;
  mine: boolean;
  sort: Sort;
  onSearch: (q: string) => void;
  onTarget: (target?: string) => void;
  onEquipment: (equipment?: string) => void;
  onMine: (mine: boolean) => void;
  onSort: (sort: Sort) => void;
};

/** Les filtres de la grille (D200) : texte, muscle ciblé, équipement, « Mes exercices », tri. */
export function ExerciseFilters(props: Props) {
  const { q, target, equipment, mine, sort } = props;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Rechercher un exercice"
            placeholder="Rechercher un exercice…"
            value={q}
            onChange={(e) => props.onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Toggle variant="outline" pressed={mine} onPressedChange={props.onMine}>
          Mes exercices
        </Toggle>
        {/* Toujours là, au même endroit (D208) : sur le catalogue entier, trier par la
            pratique fait remonter tes exercices en tête, le reste suit par nom. */}
        <Select value={sort} onValueChange={(v) => props.onSort(v as Sort)}>
          <SelectTrigger aria-label="Trier par">
            <ArrowDownUp aria-hidden="true" className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {props.compact ? (
        <div className="grid grid-cols-2 gap-2">
          <FilterSelect label="Muscle" value={target} options={CIBLES} onChange={props.onTarget} />
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
