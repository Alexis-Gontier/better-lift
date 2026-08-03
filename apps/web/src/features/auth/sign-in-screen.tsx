"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AccountDeletedNotice } from "./account-deleted-notice";
import { AuthScreen } from "./auth-screen";
import { FormSkeleton } from "./form-skeleton";
import { SignInForm } from "./sign-in-form";

/**
 * Titre et description de l'écran de connexion.
 *
 * Ils vivent dans un composant client et non dans la page : la langue est
 * résolue côté client (D29), et une page serveur ne peut donc pas les traduire.
 * La page garde ce qui reste serveur — ses métadonnées.
 *
 * `SignInForm` lit `?next=` avec `useSearchParams()`, ce qui impose une
 * frontière `<Suspense>` : sans elle, Next refuse de prérendre la page et le
 * build échoue. `AccountDeletedNotice` lit `?deleted=` et vit donc sous la même
 * frontière.
 */
export function SignInScreen() {
  const t = useTranslations("SignIn");

  return (
    <AuthScreen title={t("title")} description={t("description")}>
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <AccountDeletedNotice />
        <SignInForm />
      </Suspense>
    </AuthScreen>
  );
}
