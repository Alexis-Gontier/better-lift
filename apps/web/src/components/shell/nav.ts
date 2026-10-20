import {
  Dumbbell,
  History,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Trophy,
} from "lucide-react";
import type { FileRouteTypes } from "@/routeTree.gen";

type NavItem = { title: string; to: FileRouteTypes["to"]; icon: LucideIcon };

/** La barre latérale, d'une seule liste sans intitulé de groupe (D290, D314). */
export const NAV_ITEMS: NavItem[] = [
  { title: "Accueil", to: "/", icon: LayoutDashboard },
  { title: "Routines", to: "/routines", icon: ListChecks },
  { title: "Historique", to: "/history", icon: History },
  { title: "Records", to: "/records", icon: Trophy },
  { title: "Exercices", to: "/exercises", icon: Dumbbell },
];
