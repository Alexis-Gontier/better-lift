import type { LucideIcon } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  /** Trace un filet avant l'action (pour isoler Supprimer). */
  separated?: boolean;
};

/** Menu du clic droit sur une ligne ou une carte de liste. */
export function RowMenu({ actions, children }: { actions: RowAction[]; children: ReactNode }) {
  return (
    <ContextMenu>
      {/* `contents` : aucune boîte, mais le clic droit des enfants remonte jusqu'ici. */}
      <ContextMenuTrigger asChild>
        <div className="contents">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {actions.map((a) => (
          <Fragment key={a.label}>
            {a.separated && <ContextMenuSeparator />}
            <ContextMenuItem
              variant={a.destructive ? "destructive" : "default"}
              onSelect={a.onSelect}
            >
              {a.icon && <a.icon />}
              {a.label}
            </ContextMenuItem>
          </Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
