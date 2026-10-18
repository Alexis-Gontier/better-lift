import { useMatches, useNavigate } from "@tanstack/react-router";
import { FlaskConical, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ETATS, type Etat } from "./etat";
import { useEtat } from "./use-etat";

const LIBELLES: Record<Etat | "auto", string> = {
  auto: "Automatique",
  nominal: "Nominal",
  vide: "Vide",
  chargement: "Chargement",
  erreur: "Erreur",
};

/**
 * Forcer l'état d'une page, pour la revue (D303, D308). En développement seulement, et sur les
 * pages qui répondent aux quatre états (`staticData.etats`). « Automatique » rend la page à sa
 * requête.
 */
export function EtatBar() {
  const navigate = useNavigate();
  const force = useEtat();
  const actif = useMatches().some((m) => m.staticData.etats);
  const [open, setOpen] = useState(true);

  if (!import.meta.env.DEV || !actif) return null;

  function choisir(valeur: string) {
    const etat = valeur === "auto" ? undefined : (valeur as Etat);
    navigate({ to: ".", search: (prev) => ({ ...prev, etat }), replace: true });
  }

  if (!open) {
    return (
      <Button
        size="icon"
        variant="outline"
        className="fixed right-4 bottom-4 z-50 rounded-full shadow-md"
        aria-label="Ouvrir le sélecteur d'état"
        onClick={() => setOpen(true)}
      >
        <FlaskConical />
      </Button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-md">
      <span className="px-1 font-medium text-muted-foreground text-xs">État</span>
      <Select value={force ?? "auto"} onValueChange={choisir}>
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["auto", ...ETATS] as const).map((e) => (
            <SelectItem key={e} value={e}>
              {LIBELLES[e]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Replier"
        onClick={() => setOpen(false)}
      >
        <X />
      </Button>
    </div>
  );
}
