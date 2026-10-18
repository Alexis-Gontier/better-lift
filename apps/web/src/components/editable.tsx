import { Redo2, Undo2 } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { useDraftHistory } from "@/lib/draft-history";
import { plural } from "@/lib/format";

/** Ctrl (⌘ sur Mac) Z annule, Ctrl Maj Z ou Ctrl Y rétablit, Ctrl S enregistre (D261). */
function useEditorKeys(keys: { undo: () => void; redo: () => void; save: () => void }) {
  const latest = useRef(keys);
  latest.current = keys;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      // Une fenêtre ouverte (sélecteur d'exercice, confirmation) garde ses touches.
      if (document.querySelector("[role=dialog], [role=alertdialog]")) return;
      if (key === "z" && !e.shiftKey) latest.current.undo();
      else if ((key === "z" && e.shiftKey) || key === "y") latest.current.redo();
      else if (key === "s") latest.current.save();
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/** Annuler / rétablir le dernier pas, avec le raccourci dans l'infobulle. */
function HistoryButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const buttons = [
    {
      label: "Annuler la dernière modification",
      keys: "Ctrl Z",
      icon: Undo2,
      on: onUndo,
      can: canUndo,
    },
    { label: "Rétablir", keys: "Ctrl Y", icon: Redo2, on: onRedo, can: canRedo },
  ];
  return (
    <div className="flex items-center">
      {buttons.map((b) => (
        <Tooltip key={b.keys}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={b.label}
              aria-keyshortcuts={b.keys.replace(" ", "+")}
              disabled={!b.can}
              onClick={b.on}
            >
              <b.icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {b.label} <Kbd>{b.keys}</Kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

type Options<T> = {
  /** Le brouillon de départ : l'élément tel qu'enregistré. */
  initial: () => T;
  isDirty: (draft: T) => boolean;
  /** Combien de choses changent (D261) : un exercice, un champ… */
  count: (draft: T) => number;
  /** Ce qui empêche d'enregistrer, dit à la place du compte (D252). */
  blocker?: (draft: T) => string | null;
  onSave: (draft: T) => void;
  /** « cette routine », « cette séance » : pour la fenêtre de sortie. */
  what: string;
  /** Le toast d'un enregistrement réussi. */
  savedMessage: string;
};

/**
 * Un élément toujours modifiable, à la façon de la routine (D243, D261) : le brouillon et son
 * historique, l'état sous le nom, les actions de la tête, Ctrl Z / Ctrl Y / Ctrl S et la fenêtre
 * de sortie. `actions(menu)` montre l'état, puis le menu de l'élément tant qu'il n'est pas modifié.
 */
export function useEditable<T>(o: Options<T>) {
  const history = useDraftHistory<T>(o.initial);
  const { draft, set } = history;
  const dirty = o.isDirty(draft);
  const blocker = o.blocker?.(draft) ?? null;
  const count = o.count(draft);
  const save = () => {
    if (!dirty || blocker) return;
    o.onSave(draft);
    toast.success(o.savedMessage, { id: "element-enregistre" });
  };
  const { guard, release } = useUnsavedGuard(dirty, o.what, blocker ? undefined : save);
  useEditorKeys({ undo: history.undo, redo: history.redo, save });

  function discard() {
    // Un pas d'historique comme un autre : « Rétablir » ou Ctrl Z le défait.
    set(o.initial());
    toast("Modifications annulées", {
      id: "element-annule",
      action: { label: "Rétablir", onClick: history.undo },
    });
  }

  const pending = `${plural(count, "modification")} non enregistrée${count > 1 ? "s" : ""}`;
  // À gauche des flèches (D266) : la tête ne grandit pas à la première modification. Panneau
  // étroit, seul le compte reste (« • 2 ») ; la phrase entière est dans l'infobulle.
  const status: ReactNode = dirty && (
    <span
      className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground text-sm"
      id="element-etat"
      title={blocker ?? pending}
    >
      {blocker ?? (
        <>
          <span className="size-1.5 shrink-0 rounded-full bg-foreground" />
          <span className="@2xl:hidden">{count}</span>
          <span className="hidden @2xl:inline">{pending}</span>
        </>
      )}
    </span>
  );

  // `status: false` : sans le compte (Paramètres, où Enregistrer dit déjà tout, D271).
  const actions = (menu: ReactNode, { status: showStatus = true } = {}) => (
    <>
      {showStatus && status}
      {(history.canUndo || history.canRedo) && (
        <HistoryButtons
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={history.undo}
          onRedo={history.redo}
        />
      )}
      {dirty ? (
        <>
          <Button variant="outline" size="sm" onClick={discard}>
            Tout annuler
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                disabled={blocker !== null}
                aria-describedby="element-etat"
                aria-keyshortcuts="Control+S"
                onClick={save}
              >
                Enregistrer
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <Kbd>Ctrl S</Kbd>
            </TooltipContent>
          </Tooltip>
        </>
      ) : (
        menu
      )}
    </>
  );

  return { draft, setDraft: set, dirty, actions, guard, release };
}
