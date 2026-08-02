import { SettingsTabs } from "@/features/navigation/settings-tabs";

/**
 * Coquille des réglages : un titre, trois onglets, la section.
 *
 * Le titre vit ici et non dans chaque page : « Réglages » ne change pas d'un
 * onglet à l'autre, et le répéter trois fois obligerait à le corriger trois
 * fois. Chaque sous-page garde en revanche son `<h2>` et son `metadata.title`,
 * qui décrivent ce qu'elle affiche vraiment.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Réglages</h1>
        <p className="text-sm text-muted-foreground">
          Votre profil, vos préférences d’affichage et votre compte.
        </p>
      </header>

      {/* La bordure court sur toute la largeur, les onglets s'y posent via `-mb-px`. */}
      <div className="border-b border-border">
        <SettingsTabs />
      </div>

      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
