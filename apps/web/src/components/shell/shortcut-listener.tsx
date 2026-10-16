import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useShellDialogs } from "./shell-dialogs";
import { type Pending, resolveShortcut } from "./shortcuts";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Écoute le clavier pour toute la coquille ; Ctrl B est géré par le composant sidebar. */
export function ShortcutListener() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setPaletteOpen, setHelpOpen } = useShellDialogs();
  const pending = useRef<Pending>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;

      const { action, pending: next } = resolveShortcut(pending.current, e.key);
      pending.current = next;
      window.clearTimeout(timer.current);
      if (next) {
        timer.current = window.setTimeout(() => {
          pending.current = null;
        }, 1000);
      }

      if (!action) return;
      e.preventDefault();
      if (action.type === "navigate") navigate({ to: action.to });
      if (action.type === "help") setHelpOpen(true);
      if (action.type === "new-routine" && pathname.startsWith("/routines")) {
        navigate({ to: "/routines/new" });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, pathname, setPaletteOpen, setHelpOpen]);

  return null;
}
