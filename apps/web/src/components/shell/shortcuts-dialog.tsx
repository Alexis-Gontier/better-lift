import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useShellDialogs } from "./shell-dialogs";
import { SHORTCUT_LIST } from "./shortcuts";

export function ShortcutsDialog() {
  const { helpOpen, setHelpOpen } = useShellDialogs();
  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>
            Ils ne s'appliquent pas pendant la saisie dans un champ.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y">
          {SHORTCUT_LIST.map((s) => (
            <li key={s.label} className="flex items-center justify-between py-2 text-sm">
              <span>{s.label}</span>
              <KbdGroup>
                {s.keys.map((k, i) => (
                  // « G G » répète la même touche : l'index rend la clé unique.
                  <Kbd key={`${s.label}-${i}`}>{k}</Kbd>
                ))}
              </KbdGroup>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
