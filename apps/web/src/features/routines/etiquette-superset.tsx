import { Unlink2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * L'étiquette d'un superset (D151), en tête du groupe : « SUPERSET A » dans la
 * couleur du repère. Elle ouvre « Défaire le superset » (D152).
 */
export function EtiquetteSuperset({
  lettre,
  onDefaire,
}: {
  lettre: string;
  onDefaire: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Superset ${lettre}, options`}
          className="mb-1.5 rounded-md px-1 py-0.5 text-xs font-bold text-superset hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          Superset {lettre}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={onDefaire}>
          <Unlink2 aria-hidden="true" />
          Défaire le superset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
