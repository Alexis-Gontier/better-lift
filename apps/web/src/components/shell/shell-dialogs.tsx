import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

type ShellDialogs = {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
};

const Ctx = createContext<ShellDialogs | null>(null);

export function ShellDialogsProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const value = useMemo(
    () => ({ paletteOpen, setPaletteOpen, helpOpen, setHelpOpen }),
    [paletteOpen, helpOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShellDialogs(): ShellDialogs {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShellDialogs hors de ShellDialogsProvider");
  return ctx;
}
