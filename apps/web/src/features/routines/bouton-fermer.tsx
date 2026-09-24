import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function BoutonFermer({ onFermer }: { onFermer: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onFermer}
          aria-label="Fermer le panneau de détail"
          className="size-7 shrink-0 text-(--ink-subtle) hover:text-(--ink)"
        >
          <X aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Fermer</TooltipContent>
    </Tooltip>
  );
}
