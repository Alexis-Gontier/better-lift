import { type Metadata } from "next";

import { ProfileForm } from "@/features/account/profile-form";

export const metadata: Metadata = { title: "Profil — Réglages — better-lift" };

export default function SettingsProfilePage() {
  return <ProfileForm />;
}
