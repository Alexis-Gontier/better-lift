import { Link } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useEtat } from "@/components/states/use-etat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { FileRouteTypes } from "@/routeTree.gen";

/** Better Auth : 8 à 128 caractères par défaut (`minPasswordLength`, `maxPasswordLength`). */
export const PASSWORD = { min: 8, max: 128 } as const;

type AuthTo = Extract<FileRouteTypes["to"], "/login" | "/register">;

/** Un lien entre pages d'auth, sans l'état forcé. */
export function AuthLink({ to, children }: { to: AuthTo; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-foreground underline underline-offset-4">
      {children}
    </Link>
  );
}

/** Champs et bouton plus hauts que la densité du web : on vise et on tape. */
export const AUTH_CONTROL = "h-10";

type CardProps = {
  title: string;
  description?: ReactNode;
  /** Message d'échec de l'envoi, rendu au-dessus du formulaire. */
  error?: string | null;
  children: ReactNode;
  /** Ligne sous le formulaire : « Pas de compte ? Créer un compte ». */
  footer?: ReactNode;
};

/** Le cadre commun aux pages d'auth : titre, message d'échec, formulaire, lien secondaire. */
export function AuthCard({ title, description, error, children, footer }: CardProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-semibold text-3xl tracking-tight">{title}</h1>
        {description && <p className="text-balance text-muted-foreground text-sm">{description}</p>}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {children}
      {footer && <p className="text-center text-muted-foreground text-sm">{footer}</p>}
    </div>
  );
}

type PasswordProps = Omit<React.ComponentProps<"input">, "type">;

/** Un mot de passe qu'on peut afficher le temps de le relire. */
export function PasswordInput(props: PasswordProps) {
  const [visible, setVisible] = useState(false);
  return (
    <InputGroup className={AUTH_CONTROL}>
      <InputGroupInput type={visible ? "text" : "password"} maxLength={PASSWORD.max} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

/** Le bouton d'envoi : pleine largeur, et son libellé d'attente pendant l'envoi. */
export function SubmitButton({
  pending,
  disabled,
  children,
  pendingLabel,
}: {
  pending: boolean;
  disabled?: boolean;
  children: ReactNode;
  pendingLabel: string;
}) {
  return (
    <Button type="submit" className={`${AUTH_CONTROL} w-full`} disabled={pending || disabled}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}

/**
 * L'envoi d'un formulaire d'auth. `envoyer` rend un message d'erreur, ou `null` en cas de
 * succès ; `apres` suit un succès (relire la session, naviguer). `?etat=chargement` fige le
 * formulaire en attente, `?etat=erreur` montre l'échec propre à la page (D303).
 */
export function useEnvoi(
  envoyer: () => Promise<string | null>,
  apres: () => Promise<void>,
  echecForce: string,
) {
  const force = useEtat();
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setErreur(null);
    try {
      const echec = await envoyer();
      if (echec) setErreur(echec);
      else await apres();
    } finally {
      setPending(false);
    }
  };
  return {
    submit,
    pending: pending || force === "chargement",
    erreur: force === "erreur" ? echecForce : erreur,
  };
}
