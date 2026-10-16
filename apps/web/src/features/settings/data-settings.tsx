import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { mockRoutines } from "@/mocks/routines";
import { mockSessions } from "@/mocks/sessions";
import { mockWeights } from "@/mocks/weights";
import { HevyImport } from "./hevy-import";
import { SettingsSection } from "./settings-section";

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

function exportJson() {
  const data = { routines: mockRoutines, seances: mockSessions, pesees: mockWeights };
  download("better-lift.json", "application/json", JSON.stringify(data, null, 2));
}

export function DataSettings() {
  return (
    <>
      <SettingsSection
        title="Importer depuis Hevy"
        description="Reprenez votre historique : exportez-le en CSV depuis Hevy, puis déposez-le ici."
      >
        <HevyImport />
      </SettingsSection>

      <SettingsSection
        title="Exporter"
        description={`${mockSessions.length} séances, ${mockRoutines.length} routines, ${mockWeights.length} pesées.`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv}>
            Séances en CSV
          </Button>
          <Button variant="outline" onClick={exportJson}>
            Tout en JSON
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Supprimer les données"
        description="Efface les séances, les routines et les pesées, mais garde le compte."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Supprimer toutes les données</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer toutes les données ?</AlertDialogTitle>
              <AlertDialogDescription>
                Séances, routines, pesées et mensurations disparaîtront. C'est définitif.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction variant="destructive">Tout supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsSection>
    </>
  );
}
