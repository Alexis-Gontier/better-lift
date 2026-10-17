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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PROTO_STATES, type ProtoOptions, type ProtoState, type Variant } from "./proto-search";
import { useProto } from "./use-proto";

const STATE_LABELS: Record<ProtoState, string> = {
  nominal: "Nominal",
  vide: "Vide",
  chargement: "Chargement",
  erreur: "Erreur",
};

/** Ce que la page affichée propose : les options de ses routes, du parent à l'enfant. */
function usePageOptions(): ProtoOptions {
  return Object.assign({}, ...useMatches().map((m) => m.staticData.proto));
}

/**
 * Outil de prototypage, retiré au branchement de l'API (D223). Il ne montre que ce que la page
 * propose (D245) : ses variantes, nommées, et les états ; rien du tout s'il n'y a rien à changer.
 */
export function ProtoBar() {
  const navigate = useNavigate();
  const { variant, state } = useProto();
  const { variants = [], states = false } = usePageOptions();
  const [open, setOpen] = useState(true);

  if (variants.length === 0 && !states) return null;

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
      {variants.length > 0 && (
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={variant}
          onValueChange={(v) => v && set({ v: v as Variant })}
        >
          {variants.map((v) => (
            <ToggleGroupItem key={v.value} value={v.value} className="px-2.5">
              {v.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {states && (
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
      )}
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
