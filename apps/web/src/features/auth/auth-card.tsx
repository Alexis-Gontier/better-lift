import { Link } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useProto } from "@/components/proto/use-proto";
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

type AuthTo = Extract<
  FileRouteTypes["to"],
  "/login" | "/register" | "/forgot-password" | "/reset-password"
>;

/** Un lien entre pages d'auth : garde la variante, pas l'état forcé. */
export function AuthLink({ to, children }: { to: AuthTo; children: ReactNode }) {
  return (
    <Link
      to={to}
      search={(s) => ({ v: s.v })}
      className="font-medium text-foreground underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
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
    <InputGroup>
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
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}

/** Le délai simulé d'un aller-retour avec Better Auth. */
const LATENCY_MS = 700;

/**
 * L'envoi simulé d'un formulaire d'auth (D222) : attend, puis réussit, sauf si l'état forcé
 * est `erreur`. `?etat=chargement` fige le formulaire en attente.
 */
export function useFakeSubmit(onSuccess: () => void) {
  const { state } = useProto();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setFailed(false);
    window.setTimeout(() => {
      setPending(false);
      if (state === "erreur") setFailed(true);
      else onSuccess();
    }, LATENCY_MS);
  };
  return {
    submit,
    pending: pending || state === "chargement",
    failed: failed || state === "erreur",
  };
}
