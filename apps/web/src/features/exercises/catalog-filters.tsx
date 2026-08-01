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

export function CatalogFilters({
  draftQuery,
  filters,
  onDraftQueryChange,
  onToggleBodyPart,
  onToggleEquipment,
  onReset,
}: {
  /** Texte tel qu'il est tapé, avant le débounce qui le pousse dans l'URL. */
  draftQuery: string;
  filters: Filters;
  onDraftQueryChange: (value: string) => void;
  onToggleBodyPart: (value: BodyPart) => void;
  onToggleEquipment: (value: string) => void;
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
