import type { Preferences } from "@better-lift/shared";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEcrirePreferences } from "@/features/profil/requetes";

const AUCUN = "aucun";

/** L'objectif hebdomadaire, réglé depuis sa tuile (D186). Le Profil garde son propre réglage. */
export function DialogueObjectif({
  preferences,
  children,
}: {
  preferences: Preferences;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [valeur, setValeur] = useState(String(preferences.objectifHebdo ?? AUCUN));
  const ecrire = useEcrirePreferences();

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(o) => {
        setOuvert(o);
        if (o) setValeur(String(preferences.objectifHebdo ?? AUCUN));
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Objectif hebdomadaire</DialogTitle>
          <DialogDescription>Le nombre de séances visé chaque semaine.</DialogDescription>
        </DialogHeader>
        <Select value={valeur} onValueChange={setValeur}>
          <SelectTrigger aria-label="Séances par semaine">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUCUN}>Aucun</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} {n > 1 ? "séances" : "séance"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {ecrire.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {ecrire.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            disabled={ecrire.isPending}
            onClick={() =>
              ecrire.mutate(
                { ...preferences, objectifHebdo: valeur === AUCUN ? null : Number(valeur) },
                { onSuccess: () => setOuvert(false) },
              )
            }
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
