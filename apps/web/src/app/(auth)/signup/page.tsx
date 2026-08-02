import { type Metadata } from "next";
import { Suspense } from "react";

import { AuthScreen } from "@/features/auth/auth-screen";
import { FormSkeleton } from "@/features/auth/form-skeleton";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Créer un compte — better-lift" };

export default function SignUpPage() {
  return (
    <AuthScreen
      title="Créer un compte"
      description="Gratuit, sans limite de séances ni d’exercices."
    >
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <SignUpForm />
      </Suspense>
    </AuthScreen>
  );
}
