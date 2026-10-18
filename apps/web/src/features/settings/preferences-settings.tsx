import { useState } from "react";
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

/**
 * Préférences : l'apparence, réglage d'appareil. Fuseau, unités et formats n'ont pas de champ
 * en base : le web prend le fuseau du navigateur et les kilos (D294, D313).
 */
export function PreferencesSettings() {
  return (
    <SettingsPage title="Préférences" description="L'apparence, sur cet appareil.">
      <AppearanceSection />
    </SettingsPage>
  );
}
