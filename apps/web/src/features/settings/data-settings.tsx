import { Button } from "@/components/ui/button";
import { mockRoutines } from "@/mocks/routines";
import { mockSessions } from "@/mocks/sessions";
import { SettingsPage, SettingsSection } from "./settings-section";

/** Télécharge un fichier construit dans le navigateur. */
function download(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const header = "date;routine;duree_min;volume_kg;records";
  const rows = mockSessions.map((s) =>
    [s.date, s.routine, s.minutes, s.volume, s.records].join(";"),
  );
  download("better-lift-seances.csv", "text/csv;charset=utf-8", [header, ...rows].join("\n"));
}

/**
 * Données (D271) : l'export seul. L'import Hevy, l'export JSON et l'effacement n'ont pas
 * d'API derrière eux : ils ont quitté l'écran (D294).
 */
export function DataSettings() {
  return (
    <SettingsPage title="Données" description="Exporter votre historique.">
      <SettingsSection
        title="Exporter"
        description={`${mockSessions.length} séances, ${mockRoutines.length} routines.`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv}>
            Séances en CSV
          </Button>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
