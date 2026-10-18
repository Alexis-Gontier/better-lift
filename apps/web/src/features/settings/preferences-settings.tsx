import { useState } from "react";
import { useEditable } from "@/components/editable";
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
import { SettingsPage, SettingsSection } from "./settings-section";

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

type Formats = { timezone: string; unit: string; dateFormat: string; weekStart: string };

const TIMEZONES = ["Europe/Paris", "Europe/Brussels", "Europe/Zurich", "America/Montreal"];

/** Le réglage enregistré, en mémoire : l'API le tiendra sur le compte. */
let savedFormats: Formats = {
  timezone: "Europe/Paris",
  unit: "kg",
  dateFormat: "court",
  weekStart: "lundi",
};

function Units({ draft, setDraft }: { draft: Formats; setDraft: (f: Formats) => void }) {
  return (
    <SettingsSection
      title="Région et formats"
      description="Ils s'appliquent à toutes les pages et au mobile."
    >
      <FieldGroup>
        {/* Le fuseau découpe les séances en jours et en semaines : un réglage de région (D272). */}
        <Field>
          <FieldLabel htmlFor="timezone">Fuseau horaire</FieldLabel>
          <Select
            value={draft.timezone}
            onValueChange={(timezone) => setDraft({ ...draft, timezone })}
          >
            <SelectTrigger id="timezone" className="w-full sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>Les séances sont rangées par jour dans ce fuseau.</FieldDescription>
        </Field>
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

/** L'apparence s'applique tout de suite, hors du brouillon de la page : c'est un réglage d'appareil. */
function AppearanceSection() {
  const [draft, setDraft] = useState<Appearance>(currentAppearance());
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
  const edit = useEditable<Formats>({
    initial: () => savedFormats,
    isDirty: (d) => JSON.stringify(d) !== JSON.stringify(savedFormats),
    count: (d) =>
      (Object.keys(d) as (keyof Formats)[]).filter((k) => d[k] !== savedFormats[k]).length,
    onSave: (d) => {
      savedFormats = d;
    },
    what: "ces préférences",
    savedMessage: "Préférences enregistrées",
  });
  return (
    <SettingsPage
      title="Préférences"
      description="Fuseau, unités, formats et apparence."
      actions={edit.actions(null, { status: false })}
    >
      <Units draft={edit.draft} setDraft={(f) => edit.setDraft(f)} />
      <AppearanceSection />
      {edit.guard}
    </SettingsPage>
  );
}
