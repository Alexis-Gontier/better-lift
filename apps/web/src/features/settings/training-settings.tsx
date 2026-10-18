import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatPrecise, formatRest } from "@/lib/format";
import { SettingsPage, SettingsSection, useSetting } from "./settings-section";

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const RESTS = ["60", "90", "120", "150", "180"];
const NONE = "aucun";

type Training = {
  /** Séances visées par semaine, 1 à 7, ou aucune (`Preferences.objectifHebdo`). */
  weekly: string;
  /** Repos des exercices sans repos propre, ou aucun (`Preferences.reposDefautSec`). */
  rest: string;
  rpe: boolean;
  increment: string;
  bar: string;
  plates: number[];
  formula: string;
};

/** Le réglage enregistré, en mémoire : l'API le tiendra sur le compte. */
let savedTraining: Training = {
  weekly: "3",
  rest: "120",
  rpe: false,
  increment: "2.5",
  bar: "20",
  plates: [...PLATES],
  formula: "epley",
};

/** Les séances visées par semaine, lues par l'Accueil ; `null` sans objectif. */
export const weeklyGoal = (): number | null =>
  savedTraining.weekly === NONE ? null : Number(savedTraining.weekly);

/**
 * Entraînement (D271, D273) : objectif et repos, charges et disques, formule du 1RM ; chaque
 * choix s'enregistre aussitôt.
 */
export function TrainingSettings() {
  const [d, setTraining] = useSetting(
    () => savedTraining,
    (t) => {
      savedTraining = t;
    },
  );
  const set = (patch: Partial<Training>) => setTraining({ ...d, ...patch });
  // La barre se tape : elle s'enregistre en quittant le champ, pas à chaque chiffre.
  const [bar, setBar] = useState(d.bar);
  const togglePlate = (p: number, on: boolean) =>
    set({
      plates: on ? [...d.plates, p].sort((a, b) => b - a) : d.plates.filter((x) => x !== p),
    });

  return (
    <SettingsPage
      title="Entraînement"
      description="Objectif, repos, charges et calculs proposés partout."
    >
      <SettingsSection title="Objectif et repos">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="weekly">Objectif par semaine</FieldLabel>
            <Select value={d.weekly} onValueChange={(weekly) => set({ weekly })}>
              <SelectTrigger id="weekly" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={NONE}>Pas d'objectif</SelectItem>
                  {["1", "2", "3", "4", "5", "6", "7"].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n} séance{n === "1" ? "" : "s"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>Suivi sur l'Accueil et dans la régularité.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="rest">Repos par défaut</FieldLabel>
            <Select value={d.rest} onValueChange={(rest) => set({ rest })}>
              <SelectTrigger id="rest" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={NONE}>Aucun</SelectItem>
                  {RESTS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatRest(Number(r))}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Proposé à chaque nouvel exercice d'une routine, et pris quand une routine n'en a pas.
            </FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="rpe">Noter l'effort (RPE / RIR)</FieldLabel>
              <FieldDescription>
                Une colonne de plus dans chaque série, sur le mobile.
              </FieldDescription>
            </FieldContent>
            <Switch id="rpe" checked={d.rpe} onCheckedChange={(rpe) => set({ rpe })} />
          </Field>
        </FieldGroup>
      </SettingsSection>

      <SettingsSection
        title="Charges et disques"
        description="Pour arrondir les charges proposées à ce que la salle permet."
      >
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Incrément de charge</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                value={d.increment}
                onValueChange={(increment) => increment && set({ increment })}
                className="justify-start"
              >
                {["1", "1.25", "2.5"].map((v) => (
                  <ToggleGroupItem key={v} value={v}>
                    {formatPrecise(Number(v))} kg
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="bar">Poids de la barre (kg)</FieldLabel>
              <Input
                id="bar"
                inputMode="decimal"
                className="w-28"
                value={bar}
                onChange={(e) => setBar(e.target.value)}
                onBlur={() => bar !== d.bar && set({ bar })}
              />
            </Field>
          </div>
          <FieldSet>
            <FieldLegend variant="label">Disques disponibles (par paire)</FieldLegend>
            <div className="flex flex-wrap gap-4">
              {PLATES.map((p) => (
                <Field key={p} orientation="horizontal" className="w-auto">
                  <Checkbox
                    id={`plate-${p}`}
                    checked={d.plates.includes(p)}
                    onCheckedChange={(on) => togglePlate(p, on === true)}
                  />
                  <FieldLabel htmlFor={`plate-${p}`} className="font-normal tabular-nums">
                    {formatPrecise(p)} kg
                  </FieldLabel>
                </Field>
              ))}
            </div>
          </FieldSet>
        </FieldGroup>
      </SettingsSection>

      <SettingsSection
        title="Formule du 1RM estimé"
        description="Utilisée pour les courbes, les records et les pourcentages."
      >
        <RadioGroup value={d.formula} onValueChange={(value) => set({ formula: value })}>
          <Field orientation="horizontal">
            <RadioGroupItem value="epley" id="epley" />
            <FieldContent>
              <FieldLabel htmlFor="epley">Epley</FieldLabel>
              <FieldDescription>
                charge × (1 + répétitions / 30) — la plus courante.
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="brzycki" id="brzycki" />
            <FieldContent>
              <FieldLabel htmlFor="brzycki">Brzycki</FieldLabel>
              <FieldDescription>
                charge × 36 / (37 − répétitions) — un peu plus prudente au-delà de 10 répétitions.
              </FieldDescription>
            </FieldContent>
          </Field>
        </RadioGroup>
      </SettingsSection>
    </SettingsPage>
  );
}
