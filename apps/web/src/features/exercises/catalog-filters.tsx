"use client";

import { SearchIcon } from "lucide-react";

import { Button } from "@better-lift/ui/components/button";
import { FieldLegend, FieldSet } from "@better-lift/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@better-lift/ui/components/input-group";
import { Toggle } from "@better-lift/ui/components/toggle";
import { ToggleGroup, ToggleGroupItem } from "@better-lift/ui/components/toggle-group";
import { type BodyPart, bodyPartSchema } from "@better-lift/validators";

import { type CatalogFilters as Filters, hasActiveFilters } from "./filters";
import { BODY_PART_LABELS, EQUIPMENT_FILTERS } from "./labels";

/**
 * Les trois origines possibles, dans l'ordre où on les propose.
 *
 * `ToggleGroup` travaille sur des chaînes : l'origine, elle, est un
 * `boolean | undefined` côté filtres — `undefined` valant « les deux ». D'où
 * cette table de correspondance, qui évite de sérialiser un `undefined` en
 * chaîne vide, laquelle est réservée par Radix à « rien de sélectionné ».
 */
const ORIGINS = [
  { key: "all", value: undefined, label: "Tous" },
  { key: "catalog", value: false, label: "Catalogue" },
  { key: "mine", value: true, label: "Les miens" },
] as const;

function originKey(custom: boolean | undefined): string {
  return ORIGINS.find((origin) => origin.value === custom)?.key ?? "all";
}

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
    <div className="flex flex-col gap-4">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          id="exercise-search"
          type="search"
          value={draftQuery}
          onChange={(event) => onDraftQueryChange(event.target.value)}
          placeholder="Rechercher un exercice…"
          autoComplete="off"
          aria-label="Rechercher un exercice"
        />
      </InputGroup>

      {/*
        Un choix parmi trois, et non trois bascules : les origines s'excluent.
        `ToggleGroup type="single"` rend un vrai `radiogroup` avec navigation
        aux flèches et tabindex glissant — ce qu'une rangée de `<button
        aria-pressed>` devrait recoder entièrement.

        `onValueChange` peut recevoir "" : cliquer l'élément déjà actif le
        désélectionne. L'origine est toujours définie, on ignore donc le vide
        plutôt que de tomber dans un état qu'aucun bouton ne représente.
      */}
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={0}
        aria-label="Origine des exercices"
        value={originKey(filters.custom)}
        onValueChange={(key) => {
          const origin = ORIGINS.find((entry) => entry.key === key);

          if (origin) {
            onOriginChange(origin.value);
          }
        }}
      >
        {ORIGINS.map((origin) => (
          <ToggleGroupItem key={origin.key} value={origin.key}>
            {origin.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/*
        Les deux groupes suivants sont **multiples** et indépendants : cocher
        « Dos » et « Pectoraux » cumule, ce qu'un `ToggleGroup type="multiple"`
        rendrait aussi — mais il renvoie le tableau entier dans l'ordre des
        clics, alors que `toggleValue` le maintient trié. Cet ordre entre dans
        la clé de cache TanStack (voir `filters.ts`) : le perdre dédoublerait
        les requêtes. D'où des `Toggle` indépendants, un par valeur.
      */}
      <FieldSet>
        <FieldLegend className="sr-only">Filtrer par partie du corps</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {bodyPartSchema.options.map((bodyPart) => (
            <Toggle
              key={bodyPart}
              variant="outline"
              size="sm"
              pressed={filters.bodyPart.includes(bodyPart)}
              onPressedChange={() => onToggleBodyPart(bodyPart)}
            >
              {BODY_PART_LABELS[bodyPart]}
            </Toggle>
          ))}
        </div>
      </FieldSet>

      <FieldSet>
        <FieldLegend className="sr-only">Filtrer par équipement</FieldLegend>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_FILTERS.map((equipment) => (
            <Toggle
              key={equipment.value}
              variant="outline"
              size="sm"
              pressed={filters.equipment.includes(equipment.value)}
              onPressedChange={() => onToggleEquipment(equipment.value)}
            >
              {equipment.label}
            </Toggle>
          ))}
        </div>
      </FieldSet>

      {active && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="self-start px-0"
          onClick={onReset}
        >
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}
