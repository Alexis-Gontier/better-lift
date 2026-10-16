import {
  CalendarDays,
  Dumbbell,
  History,
  House,
  ListChecks,
  type LucideIcon,
  Scale,
  TrendingUp,
} from "lucide-react";
import type { FileRouteTypes } from "@/routeTree.gen";

type NavItem = { title: string; to: FileRouteTypes["to"]; icon: LucideIcon };
export type NavGroup = { label: string | null; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ title: "Accueil", to: "/", icon: House }] },
  {
    label: "Entraînement",
    items: [
      { title: "Planning", to: "/planning", icon: CalendarDays },
      { title: "Routines", to: "/routines", icon: ListChecks },
      { title: "Exercices", to: "/exercises", icon: Dumbbell },
      { title: "Historique", to: "/history", icon: History },
    ],
  },
  {
    label: "Analyse",
    items: [
      { title: "Progression", to: "/progress", icon: TrendingUp },
      { title: "Corps", to: "/body", icon: Scale },
    ],
  },
];

/** L'entrée est active sur sa page et ses sous-pages ; l'Accueil, seulement sur « / ». */
export function isActive(to: string, pathname: string): boolean {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}
