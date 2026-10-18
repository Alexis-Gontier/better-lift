import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SettingsSection, useDraft } from "./settings-section";

type Appearance = "clair" | "sombre" | "systeme";
const THEME_KEY = "better-lift-theme"; // la clé que lit le script de `index.html`

function currentAppearance(): Appearance {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" ? "sombre" : t === "light" ? "clair" : "systeme";
  } catch {
    return "systeme";
  }
}

/** Le thème s'applique sur-le-champ ; « Système » suit la préférence de l'appareil. */
function applyAppearance(a: Appearance) {
  const dark =
    a === "sombre" || (a === "systeme" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  try {
    if (a === "systeme") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, a === "sombre" ? "dark" : "light");
  } catch {
    // Stockage indisponible : le choix vaut pour la session.
  }
}

function Units() {
  const { draft, setDraft, dirty, save } = useDraft({
    unit: "kg",
    dateFormat: "court",
    weekStart: "lundi",
  });
  return (
    <SettingsSection
      title="Unités et formats"
      description="Ils s'appliquent à toutes les pages et au mobile."
      dirty={dirty}
      onSave={save}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Unité de charge</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={draft.unit}
            onValueChange={(unit) => unit && setDraft({ ...draft, unit })}
            className="justify-start"
          >
            <ToggleGroupItem value="kg">Kilogrammes (kg)</ToggleGroupItem>
            <ToggleGroupItem value="lb">Livres (lb)</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="date-format">Format de date</FieldLabel>
          <Select
            value={draft.dateFormat}
            onValueChange={(dateFormat) => setDraft({ ...draft, dateFormat })}
          >
            <SelectTrigger id="date-format" className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="court">16 oct. 2026</SelectItem>
                <SelectItem value="long">vendredi 16 octobre 2026</SelectItem>
                <SelectItem value="numerique">16/10/2026</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Premier jour de la semaine</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={draft.weekStart}
            onValueChange={(weekStart) => weekStart && setDraft({ ...draft, weekStart })}
            className="justify-start"
          >
            <ToggleGroupItem value="lundi">Lundi</ToggleGroupItem>
            <ToggleGroupItem value="dimanche">Dimanche</ToggleGroupItem>
          </ToggleGroup>
          <FieldDescription>
            Les semaines du Planning et des statistiques commencent ce jour-là.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </SettingsSection>
  );
}

function AppearanceSection() {
  const { draft, setDraft } = useDraft<Appearance>(currentAppearance());
  return (
    <SettingsSection title="Apparence" description="Appliquée tout de suite, sur cet appareil.">
      <ToggleGroup
        type="single"
        variant="outline"
        value={draft}
        onValueChange={(v) => {
          if (!v) return;
          setDraft(v as Appearance);
          applyAppearance(v as Appearance);
        }}
        className="justify-start"
      >
        <ToggleGroupItem value="clair">Clair</ToggleGroupItem>
        <ToggleGroupItem value="sombre">Sombre</ToggleGroupItem>
        <ToggleGroupItem value="systeme">Système</ToggleGroupItem>
      </ToggleGroup>
    </SettingsSection>
  );
}

export function PreferencesSettings() {
  return (
    <>
      <Units />
      <AppearanceSection />
    </>
  );
}
