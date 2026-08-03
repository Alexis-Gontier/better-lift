import { type Metadata } from "next";
import { Suspense } from "react";

import { AccountDeletedNotice } from "@/features/auth/account-deleted-notice";
import { AuthScreen } from "@/features/auth/auth-screen";
import { FormSkeleton } from "@/features/auth/form-skeleton";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = { title: "Connexion — better-lift" };

/**
 * `SignInForm` lit `?next=` avec `useSearchParams()`, ce qui impose une
 * frontière `<Suspense>` : sans elle, Next refuse de prérendre la page et le
 * build échoue. `AccountDeletedNotice` lit `?deleted=` et vit donc sous la même
 * frontière.
 */
export default function LoginPage() {
  return (
    <AuthScreen title="Se connecter" description="Reprenez là où vous en étiez.">
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <AccountDeletedNotice />
        <SignInForm />
      </Suspense>
    </AuthScreen>
  );
}
