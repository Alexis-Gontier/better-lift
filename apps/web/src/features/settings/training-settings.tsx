import { useEditable } from "@/components/editable";
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
import { SettingsPage, SettingsSection } from "./settings-section";

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const RESTS = ["60", "90", "120", "150", "180"];

type Training = {
  rest: string;
  rpe: boolean;
  increment: string;
  bar: string;
  plates: number[];
  formula: string;
};

/** Le réglage enregistré, en mémoire : l'API le tiendra sur le compte. */
let savedTraining: Training = {
  rest: "120",
  rpe: false,
  increment: "2.5",
  bar: "20",
  plates: [...PLATES],
  formula: "epley",
};

/**
 * Entraînement (D271) : séries et repos, charges et disques, formule du 1RM — un seul brouillon
 * pour la page, enregistré d'un coup.
 */
export function TrainingSettings() {
  const edit = useEditable<Training>({
    initial: () => savedTraining,
    isDirty: (d) => JSON.stringify(d) !== JSON.stringify(savedTraining),
    count: (d) =>
      (Object.keys(d) as (keyof Training)[]).filter(
        (k) => JSON.stringify(d[k]) !== JSON.stringify(savedTraining[k]),
      ).length,
    onSave: (d) => {
      savedTraining = d;
    },
    what: "ces réglages",
    savedMessage: "Réglages enregistrés",
  });
  const d = edit.draft;
  const set = (patch: Partial<Training>) => edit.setDraft((x) => ({ ...x, ...patch }));
  const togglePlate = (p: number, on: boolean) =>
    set({
      plates: on ? [...d.plates, p].sort((a, b) => b - a) : d.plates.filter((x) => x !== p),
    });

  return (
    <SettingsPage
      title="Entraînement"
      description="Repos, charges et calculs proposés partout."
      actions={edit.actions(null, { status: false })}
    >
      <SettingsSection title="Séries et repos">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="rest">Repos par défaut</FieldLabel>
            <Select value={d.rest} onValueChange={(rest) => set({ rest })}>
              <SelectTrigger id="rest" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {RESTS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatRest(Number(r))}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>Proposé à chaque nouvel exercice d'une routine.</FieldDescription>
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
                value={d.bar}
                onChange={(e) => set({ bar: e.target.value })}
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
      {edit.guard}
    </SettingsPage>
  );
}
