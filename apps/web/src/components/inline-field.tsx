import { type ReactNode, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  /** La valeur à modifier, telle qu'on la tape. */
  value: string;
  /** Son affichage hors modification (« 80 kg », « 1 min 30 ») ; la valeur brute à défaut. */
  display?: ReactNode;
  /** Appelé en quittant le champ, seulement si la valeur a changé. */
  onCommit: (value: string) => void;
  label: string;
  type?: "text" | "number";
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

/**
 * Modification champ par champ (variante C, D239) : la valeur se lit comme du texte ; un clic
 * la change en champ, Entrée ou un clic ailleurs l'enregistre, Échap l'abandonne.
 */
export function InlineField({
  value,
  display,
  onCommit,
  label,
  type = "text",
  multiline = false,
  placeholder,
  className,
  inputClassName,
}: Props) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    const empty = value === "";
    return (
      <button
        type="button"
        aria-label={`Modifier : ${label}`}
        onClick={() => setEditing(true)}
        className={cn(
          "-mx-1.5 cursor-text rounded-md px-1.5 text-left transition-colors hover:bg-muted",
          empty && "text-muted-foreground",
          className,
        )}
      >
        {empty ? placeholder : (display ?? value)}
      </button>
    );
  }

  const finish = (next: string) => {
    setEditing(false);
    if (next.trim() !== value.trim()) onCommit(next);
  };
  const common = {
    defaultValue: value,
    "aria-label": label,
    placeholder,
    autoFocus: true,
    onBlur: (e: { currentTarget: { value: string } }) => finish(e.currentTarget.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Escape") setEditing(false);
      // Dans une note, Entrée va à la ligne ; Ctrl Entrée enregistre.
      if (e.key === "Enter" && (!multiline || e.ctrlKey)) e.currentTarget.blur();
    },
  };
  return multiline ? (
    <Textarea {...common} className={inputClassName} />
  ) : (
    <Input
      {...common}
      type={type}
      inputMode={type === "number" ? "decimal" : undefined}
      className={cn("h-8", inputClassName)}
    />
  );
}
