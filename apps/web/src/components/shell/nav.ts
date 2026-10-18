import { Dumbbell, History, House, ListChecks, type LucideIcon } from "lucide-react";
import type { FileRouteTypes } from "@/routeTree.gen";

type NavItem = { title: string; to: FileRouteTypes["to"]; icon: LucideIcon };

/** La barre latérale, d'une seule liste sans intitulé de groupe (D290). */
export const NAV_ITEMS: NavItem[] = [
  { title: "Accueil", to: "/", icon: House },
  { title: "Routines", to: "/routines", icon: ListChecks },
  { title: "Historique", to: "/history", icon: History },
  { title: "Exercices", to: "/exercises", icon: Dumbbell },
];
