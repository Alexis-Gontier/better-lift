import {
  Dumbbell,
  History,
  House,
  ListChecks,
  type LucideIcon,
  Scale,
  Settings,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { FileRouteTypes } from "@/routeTree.gen";

type NavItem = { title: string; to: FileRouteTypes["to"]; icon: LucideIcon };
export type NavGroup = { label: string | null; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ title: "Accueil", to: "/", icon: House }] },
  {
    label: "Entraînement",
    items: [
      { title: "Routines", to: "/routines", icon: ListChecks },
      { title: "Exercices", to: "/exercises", icon: Dumbbell },
      { title: "Historique", to: "/history", icon: History },
    ],
  },
  {
    label: "Analyse",
    items: [
      { title: "Records", to: "/records", icon: Trophy },
      { title: "Progression", to: "/progress", icon: TrendingUp },
      { title: "Corps", to: "/body", icon: Scale },
    ],
  },
  { label: null, items: [{ title: "Paramètres", to: "/settings", icon: Settings }] },
];
