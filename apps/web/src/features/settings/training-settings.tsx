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
import { SettingsSection, useDraft } from "./settings-section";

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const RESTS = ["60", "90", "120", "150", "180"];

export function TrainingSettings() {
  // Un brouillon par section : chacune s'enregistre seule.
  const sets = useDraft({ rest: "120", rpe: false });
  const loads = useDraft({ increment: "2.5", bar: "20", plates: [25, 20, 15, 10, 5, 2.5, 1.25] });
  const formula = useDraft({ formula: "epley" });
  const togglePlate = (p: number, on: boolean) =>
    loads.setDraft({
      ...loads.draft,
      plates: on
        ? [...loads.draft.plates, p].sort((a, b) => b - a)
        : loads.draft.plates.filter((x) => x !== p),
    });

  return (
    <>
      <SettingsSection title="Séries et repos" dirty={sets.dirty} onSave={sets.save}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="rest">Repos par défaut</FieldLabel>
            <Select
              value={sets.draft.rest}
              onValueChange={(rest) => sets.setDraft({ ...sets.draft, rest })}
            >
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
            <Switch
              id="rpe"
              checked={sets.draft.rpe}
              onCheckedChange={(rpe) => sets.setDraft({ ...sets.draft, rpe })}
            />
          </Field>
        </FieldGroup>
      </SettingsSection>

      <SettingsSection
        title="Charges et disques"
        description="Pour arrondir les charges proposées à ce que la salle permet."
        dirty={loads.dirty}
        onSave={loads.save}
      >
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Incrément de charge</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                value={loads.draft.increment}
                onValueChange={(increment) =>
                  increment && loads.setDraft({ ...loads.draft, increment })
                }
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
                value={loads.draft.bar}
                onChange={(e) => loads.setDraft({ ...loads.draft, bar: e.target.value })}
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
                    checked={loads.draft.plates.includes(p)}
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
        dirty={formula.dirty}
        onSave={formula.save}
      >
        <RadioGroup
          value={formula.draft.formula}
          onValueChange={(value) => formula.setDraft({ formula: value })}
        >
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
    </>
  );
}
