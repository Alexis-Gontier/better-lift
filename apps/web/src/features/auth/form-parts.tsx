"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Alert, AlertDescription } from "@better-lift/ui/components/alert";
import { Button } from "@better-lift/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@better-lift/ui/components/field";
import { Input } from "@better-lift/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@better-lift/ui/components/input-group";
import { Spinner } from "@better-lift/ui/components/spinner";

/**
 * Briques communes aux quatre formulaires d'authentification.
 *
 * Ce ne sont pas des composants de style : la mise en forme vient de
 * `@better-lift/ui`. Ne reste ici que ce qui est propre à l'authentification —
 * un champ étiqueté qui sait porter son erreur, un champ mot de passe qui se
 * dévoile, et un bouton d'envoi qui connaît son état d'attente.
 *
 * `TextField` et non `Field` : shadcn expose déjà un `Field`, et deux composants
 * du même nom se relisent mal dans le même fichier.
 */

/**
 * Les champs sont en `size="lg"` — 44 px, la cible tactile minimale. Ce n'est
 * pas une surcharge locale : la variante vit dans `@better-lift/ui`, pour que
 * deux écrans ne puissent pas choisir deux hauteurs différentes à coups de
 * `className` sans que rien ne le signale.
 *
 * Pourquoi ici et pas partout : sur les écrans internes la densité par défaut
 * est la bonne, les lignes sont hautes et les zones cliquables débordent du
 * texte. Un formulaire d'authentification, lui, est rempli debout, sur un
 * téléphone, une seule fois — c'est exactement là qu'un champ de 36 px se rate.
 */

/**
 * Câble `aria-describedby` sur ce qui existe réellement.
 *
 * Un `aria-describedby` qui pointe vers un identifiant absent n'est pas ignoré
 * poliment : selon le lecteur d'écran, il annonce du vide ou tait la référence
 * suivante. On ne cite donc que les nœuds rendus, et l'erreur passe **avant** la
 * description — c'est ce qui doit être entendu en premier.
 */
function describedBy(errorId: string | undefined, hintId: string | undefined) {
  const ids = [errorId, hintId].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
}

type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string | null;
};

export function TextField({
  label,
  hint,
  error,
  ...input
}: React.ComponentProps<"input"> & FieldShellProps) {
  /*
    `useId` produit la même valeur au serveur et au client ; un compteur de
    module en donnerait deux différentes et casserait l'hydratation.
  */
  const generatedId = useId();
  const id = input.id ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <Input
        {...input}
        id={id}
        size="lg"
        /*
          `aria-invalid` fait deux choses d'un coup : il annonce l'état au
          lecteur d'écran et déclenche les styles `aria-invalid:` de `Input`.
          C'est ce qui évite de signaler l'erreur par la seule couleur.
        */
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(error ? errorId : undefined, hint ? hintId : undefined)}
      />

      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
    </Field>
  );
}

/**
 * Champ mot de passe avec bascule d'affichage.
 *
 * Ce n'est pas un confort : sans elle, on tape à l'aveugle sur un clavier
 * mobile qui corrige tout seul, on se trompe, et on finit par croire que le
 * compte est cassé. Le gain de sécurité du masquage systématique est en
 * revanche théorique dès qu'on n'est pas observé — c'est pourquoi la bascule
 * est aujourd'hui recommandée plutôt que tolérée.
 *
 * Trois détails qui comptent :
 *
 * - Le bouton porte `aria-pressed` : c'est un interrupteur, pas une action, et
 *   son libellé annonce ce qu'il fera, jamais l'état courant seul.
 * - Il est `tabIndex={-1}` : au clavier, on veut passer du mot de passe au
 *   bouton d'envoi. S'arrêter sur un œil entre les deux est un obstacle, et la
 *   bascule reste atteignable à la souris comme au doigt.
 * - Repasser en `type="password"` ne perd ni le curseur ni la sélection : le
 *   navigateur les conserve, le champ n'est pas remonté.
 */
export function PasswordField({
  label,
  hint,
  error,
  ...input
}: React.ComponentProps<"input"> & FieldShellProps) {
  const generatedId = useId();
  const id = input.id ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [revealed, setRevealed] = useState(false);
  const t = useTranslations("AuthFields");

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <InputGroup size="lg">
        <InputGroupInput
          {...input}
          id={id}
          type={revealed ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(error ? errorId : undefined, hint ? hintId : undefined)}
        />

        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-sm"
            aria-pressed={revealed}
            aria-controls={id}
            aria-label={revealed ? t("hidePassword") : t("showPassword")}
            tabIndex={-1}
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
    </Field>
  );
}

/**
 * Erreur qui ne vise aucun champ : identifiants refusés, quota atteint, API
 * injoignable. Les erreurs de saisie, elles, s'affichent sous le champ fautif —
 * un message groupé en haut oblige à retrouver soi-même lequel est en cause.
 *
 * `Alert` porte déjà `role="alert"`, donc le message est annoncé dès son
 * apparition sans déplacer l'attention.
 */
export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

/** `FieldSeparator` dessine le « ─ ou ─ ». Ré-exporté sous un nom de formulaire. */
export { FieldSeparator as FormSeparator } from "@better-lift/ui/components/field";

/**
 * `Button` n'a pas de `pending` : la convention shadcn est de composer avec un
 * `Spinner` et `disabled`. Le libellé reste affiché pendant l'attente — le
 * remplacer par « … » ferait disparaître l'action sous le curseur.
 *
 * `aria-busy` complète `disabled` : le second dit que le bouton ne répond plus,
 * le premier dit pourquoi.
 */
export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="w-full">
      {pending && <Spinner data-icon="inline-start" />}
      {children}
    </Button>
  );
}
