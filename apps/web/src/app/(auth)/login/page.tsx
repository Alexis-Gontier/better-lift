import { type Metadata } from "next";

import { SignInScreen } from "@/features/auth/sign-in-screen";

/**
 * Le titre d'onglet reste en français : les métadonnées sont produites côté
 * serveur, qui ne connaît pas la langue du profil (D29). Le jour où un cookie
 * de langue existera, `generateMetadata` pourra le lire.
 */
export const metadata: Metadata = { title: "Connexion — better-lift" };

export default function LoginPage() {
  return <SignInScreen />;
}
