import { useNavigate } from "@tanstack/react-router";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PROTO_STATES, type ProtoState, VARIANTS, type Variant } from "./proto-search";
import { useProto } from "./use-proto";

const STATE_LABELS: Record<ProtoState, string> = {
  nominal: "Nominal",
  vide: "Vide",
  chargement: "Chargement",
  erreur: "Erreur",
};

/** Outil de prototypage, retiré au branchement de l'API (D223). */
export function ProtoBar() {
  const navigate = useNavigate();
  const { variant, state } = useProto();
  const [open, setOpen] = useState(true);

  function set(patch: { v?: Variant; etat?: ProtoState }) {
    navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }), replace: true });
  }

  if (!open) {
    return (
      <Button
        size="icon"
        variant="outline"
        className="fixed right-4 bottom-4 z-50 rounded-full shadow-md"
        aria-label="Ouvrir la barre de prototypage"
        onClick={() => setOpen(true)}
      >
        <FlaskConical />
      </Button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-md">
      <span className="px-1 font-medium text-muted-foreground text-xs">Proto</span>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={variant}
        onValueChange={(v) => v && set({ v: v as Variant })}
      >
        {VARIANTS.map((v) => (
          <ToggleGroupItem key={v} value={v} aria-label={`Variante ${v.toUpperCase()}`}>
            {v.toUpperCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Select value={state} onValueChange={(etat) => set({ etat: etat as ProtoState })}>
        <SelectTrigger size="sm" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROTO_STATES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATE_LABELS[s]}
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
