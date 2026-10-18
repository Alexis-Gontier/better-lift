import type { Preferences } from "@better-lift/shared";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { StateError } from "@/components/states/state-error";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRest } from "@/lib/format";
import { preferencesQuery, useEnregistrerPreferences } from "./queries";
import { SettingsPage, SettingsSection } from "./settings-section";

const RESTS = [60, 90, 120, 150, 180];
/** Radix refuse une valeur vide : « aucun » vaut `null` en base. */
const NONE = "aucun";

const versChamp = (n: number | null) => (n === null ? NONE : String(n));
const versValeur = (v: string) => (v === NONE ? null : Number(v));

/**
 * Entraînement (D271, D273) : objectif et repos, ce que porte `Preferences` (D129) ; chaque choix
 * s'enregistre aussitôt. Charges et disques, formule du 1RM et RPE n'ont pas de champ en base :
 * ils ont quitté l'écran (D294).
 */
export function TrainingSettings() {
  const requete = useQuery(preferencesQuery());
  const enregistrer = useEnregistrerPreferences();
  const p = requete.data;

  // Le chargement avant `!data` : sinon le squelette resterait pour toujours après une erreur.
  if (requete.isPending) return <Skeleton className="h-48 rounded-xl" />;
  if (requete.isError || !p)
    return (
      <StateError
        title="Les préférences n'ont pas pu se charger"
        reessayer={() => void requete.refetch()}
      />
    );

  const set = (patch: Partial<Preferences>) =>
    enregistrer.mutate(
      { ...p, ...patch },
      {
        onSuccess: () => toast.success("Réglage enregistré", { id: "reglage-enregistre" }),
        onError: (e) => toast.error(e.message),
      },
    );
  const rests =
    p.reposDefautSec === null || RESTS.includes(p.reposDefautSec)
      ? RESTS
      : [...RESTS, p.reposDefautSec].sort((a, b) => a - b);

  return (
    <SettingsPage title="Entraînement" description="Objectif de la semaine et repos par défaut.">
      <SettingsSection title="Objectif et repos">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="weekly">Objectif par semaine</FieldLabel>
            <Select
              value={versChamp(p.objectifHebdo)}
              disabled={enregistrer.isPending}
              onValueChange={(v) => set({ objectifHebdo: versValeur(v) })}
            >
              <SelectTrigger id="weekly" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={NONE}>Pas d'objectif</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} séance{n === 1 ? "" : "s"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>Le nombre de séances visées chaque semaine.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="rest">Repos par défaut</FieldLabel>
            <Select
              value={versChamp(p.reposDefautSec)}
              disabled={enregistrer.isPending}
              onValueChange={(v) => set({ reposDefautSec: versValeur(v) })}
            >
              <SelectTrigger id="rest" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={NONE}>Aucun</SelectItem>
                  {rests.map((r) => (
                    <SelectItem key={r} value={String(r)}>
                      {formatRest(r)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Pris par les exercices d'une routine qui n'ont pas de repos propre.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </SettingsSection>
    </SettingsPage>
  );
}
