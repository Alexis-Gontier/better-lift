import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRest } from "@/lib/format";
import { SettingsPage, SettingsSection, useSetting } from "./settings-section";

const RESTS = ["60", "90", "120", "150", "180"];
const NONE = "aucun";

type Training = {
  /** Séances visées par semaine, 1 à 7, ou aucune (`Preferences.objectifHebdo`). */
  weekly: string;
  /** Repos des exercices sans repos propre, ou aucun (`Preferences.reposDefautSec`). */
  rest: string;
};

/** Le réglage enregistré, en mémoire : l'API le tiendra sur le compte. */
let savedTraining: Training = { weekly: "3", rest: "120" };

/**
 * Entraînement (D271, D273) : objectif et repos, ce que porte `Preferences` ; chaque choix
 * s'enregistre aussitôt. Charges et disques, formule du 1RM et RPE n'ont pas de champ en base :
 * ils ont quitté l'écran (D294).
 */
export function TrainingSettings() {
  const [d, setTraining] = useSetting(
    () => savedTraining,
    (t) => {
      savedTraining = t;
    },
  );
  const set = (patch: Partial<Training>) => setTraining({ ...d, ...patch });

  return (
    <SettingsPage title="Entraînement" description="Objectif de la semaine et repos par défaut.">
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
        </FieldGroup>
      </SettingsSection>
    </SettingsPage>
  );
}
