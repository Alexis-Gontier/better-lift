import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getTheme, setTheme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setLocal] = useState(getTheme);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label="Changer de thème"
          onClick={() => {
            setTheme(next);
            setLocal(next);
          }}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === "dark" ? "Thème clair" : "Thème sombre"}</TooltipContent>
    </Tooltip>
  );
}
