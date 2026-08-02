import { UserRoundIcon } from "lucide-react";
import { type Metadata } from "next";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@better-lift/ui/components/empty";

export const metadata: Metadata = { title: "Profil — Réglages — better-lift" };

export default function SettingsProfilePage() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserRoundIcon />
          </EmptyMedia>
          <EmptyTitle>Profil</EmptyTitle>
          <EmptyDescription>
            Nom, pseudo, avatar et bio. Le formulaire arrive ; l’écran existe déjà pour que la
            navigation des réglages soit complète.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
