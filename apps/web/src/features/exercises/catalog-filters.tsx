"use client";

import { type BodyPart, bodyPartSchema } from "@better-lift/validators";

import { type CatalogFilters as Filters, hasActiveFilters } from "./filters";
import { BODY_PART_LABELS, EQUIPMENT_FILTERS } from "./labels";

/**
 * Bascule de filtre. `aria-pressed` plutôt qu'une case à cocher déguisée : le
 * bouton est annoncé « activé / désactivé », ce qui est exactement son état,
 * et il reste utilisable au clavier sans travail supplémentaire.
 */
function FilterChip({
  label,
  pressed,
  onToggle,
}: {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={`rounded-full px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        pressed
          ? "bg-accent font-medium text-surface"
          : "bg-surface-raised text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

/** Les trois origines possibles, dans l'ordre où on les propose. */
const ORIGINS: ReadonlyArray<{ value: boolean | undefined; label: string }> = [
  { value: undefined, label: "Tous" },
  { value: false, label: "Catalogue" },
  { value: true, label: "Les miens" },
];

export function CatalogFilters({
  draftQuery,
  filters,
  onDraftQueryChange,
  onToggleBodyPart,
  onToggleEquipment,
  onOriginChange,
  onReset,
}: {
  /** Texte tel qu'il est tapé, avant le débounce qui le pousse dans l'URL. */
  draftQuery: string;
  filters: Filters;
  onDraftQueryChange: (value: string) => void;
  onToggleBodyPart: (value: BodyPart) => void;
  onToggleEquipment: (value: string) => void;
  onOriginChange: (value: boolean | undefined) => void;
  onReset: () => void;
}) {
  const active = hasActiveFilters({ ...filters, q: draftQuery });

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="exercise-search" className="sr-only">
          Rechercher un exercice
        </label>
        <input
          id="exercise-search"
          type="search"
          value={draftQuery}
          onChange={(event) => onDraftQueryChange(event.target.value)}
          placeholder="Rechercher un exercice…"
          autoComplete="off"
          className="w-full rounded-lg bg-surface-raised px-4 py-2.5 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>

      {/*
        Un choix parmi trois, et non trois bascules : les origines s'excluent.
        De vrais boutons radio plutôt que des `<button role="radio">` — le
        navigateur donne alors gratuitement la navigation aux flèches et
        l'annonce « 2 sur 3 », qu'une imitation devrait recoder entièrement.
      */}
      <fieldset className="flex gap-1 text-sm">
        <legend className="sr-only">Origine des exercices</legend>
        {ORIGINS.map((origin) => (
          <label
            key={origin.label}
            className="cursor-pointer rounded-lg px-3 py-1.5 text-ink-muted transition hover:text-ink has-checked:bg-surface-raised has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name="exercise-origin"
              className="sr-only"
              checked={filters.custom === origin.value}
              onChange={() => onOriginChange(origin.value)}
            />
            {origin.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Filtrer par partie du corps</legend>
        {bodyPartSchema.options.map((bodyPart) => (
          <FilterChip
            key={bodyPart}
            label={BODY_PART_LABELS[bodyPart]}
            pressed={filters.bodyPart.includes(bodyPart)}
            onToggle={() => onToggleBodyPart(bodyPart)}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Filtrer par équipement</legend>
        {EQUIPMENT_FILTERS.map((equipment) => (
          <FilterChip
            key={equipment.value}
            label={equipment.label}
            pressed={filters.equipment.includes(equipment.value)}
            onToggle={() => onToggleEquipment(equipment.value)}
          />
        ))}
      </fieldset>

      {active && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
