import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErreurApi, lire } from "@/lib/api";
import { URL_API } from "@/lib/config";
import { SettingsPage, SettingsSection } from "./settings-section";

/**
 * Télécharge l'export de l'API. Par `fetch` plutôt qu'un simple lien : en développement, l'API
 * est sur une autre origine et le cookie ne suit qu'avec `credentials` ; en production, ça
 * marche pareil.
 */
async function telecharger(): Promise<void> {
  const res = await lire(
    () => fetch(`${URL_API}/export/seances.csv`, { credentials: "include" }),
    "L'export n'a pas pu être préparé.",
  );
  // Un `fetch` brut n'a pas le `ok` littéral du RPC : `lire` ne sait pas le rétrécir.
  const url = URL.createObjectURL(await (res as unknown as Response).blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "better-lift-seances.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Données (D271) : l'export seul, une ligne par série (`versCsv` de `shared`). L'import Hevy,
 * l'export JSON et l'effacement n'ont pas d'API derrière eux : ils ont quitté l'écran (D294).
 */
export function DataSettings() {
  const [pending, setPending] = useState(false);
  return (
    <SettingsPage title="Données" description="Exporter votre historique.">
      <SettingsSection title="Exporter" description="Toutes vos séances, une ligne par série.">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await telecharger();
              } catch (e) {
                toast.error(e instanceof ErreurApi ? e.message : "L'export a échoué.");
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Préparation…" : "Séances en CSV"}
          </Button>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
