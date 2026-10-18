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

type AuthTo = Extract<
  FileRouteTypes["to"],
  "/login" | "/register" | "/forgot-password" | "/reset-password"
>;

/** Un lien entre pages d'auth, sans l'état forcé. `quiet` : petit et gris, à côté d'un libellé. */
export function AuthLink({
  to,
  quiet,
  children,
}: {
  to: AuthTo;
  quiet?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={
        quiet
          ? "text-muted-foreground text-xs hover:text-foreground"
          : "font-medium text-foreground underline underline-offset-4"
      }
    >
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

/** Le délai simulé d'un aller-retour avec Better Auth. */
const LATENCY_MS = 700;

/**
 * L'envoi simulé d'un formulaire d'auth (D222) : attend, puis réussit, sauf si l'état forcé
 * est `erreur`. `?etat=chargement` fige le formulaire en attente.
 */
export function useFakeSubmit(onSuccess: () => void) {
  // Tant que la page lit la maquette : nominal, sauf état forcé par l'URL.
  const state = useEtat() ?? "nominal";
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
