import {
  ChartLineIcon,
  ClipboardListIcon,
  DumbbellIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  SettingsIcon,
} from "lucide-react";

export type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
};

/**
 * Destinations de la navigation principale.
 *
 * Une seule liste, consommée par la sidebar **et** par la topbar qui en tire le
 * libellé de la section courante. L'ancien `NavLink` typait sa cible par une
 * union littérale des quatre routes existantes : chaque destination ajoutée
 * demandait d'éditer le type, le composant et le layout. Ici, ajouter une
 * entrée est une ligne.
 *
 * L'ordre est celui de la doc 05 et il n'est pas indifférent : il va du plus
 * consulté (le tableau de bord, écran d'arrivée) au plus rare.
 */
export const MAIN_NAV: readonly NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboardIcon },
  { href: "/routines", label: "Routines", icon: ClipboardListIcon },
  { href: "/workouts", label: "Historique", icon: HistoryIcon },
  { href: "/exercises", label: "Exercices", icon: DumbbellIcon },
  { href: "/stats", label: "Statistiques", icon: ChartLineIcon },
];

/**
 * Bas de sidebar : ce qu'on cherche, pas ce qu'on parcourt.
 *
 * Les réglages ne sont pas une étape du travail quotidien — les tenir à part
 * évite qu'ils captent l'attention à chaque coup d'œil, tout en les gardant
 * atteignables en un clic depuis n'importe quel écran.
 */
export const SECONDARY_NAV: readonly NavItem[] = [
  { href: "/settings", label: "Réglages", icon: SettingsIcon },
];

/**
 * Sous-navigation des réglages (doc 05 : profil · préférences · compte).
 *
 * Sans icône, contrairement aux entrées ci-dessus : ces onglets ne sont jamais
 * réduits à un pictogramme, et trois icônes proches n'y ajouteraient qu'un
 * bruit qu'il faudrait déchiffrer.
 *
 * `/settings` n'a pas de page propre — elle redirige vers `/settings/profile`.
 * C'est pourquoi la racine du groupe ne figure pas dans la liste.
 */
export const SETTINGS_TABS: readonly { readonly href: string; readonly label: string }[] = [
  { href: "/settings/profile", label: "Profil" },
  { href: "/settings/preferences", label: "Préférences" },
  { href: "/settings/account", label: "Compte" },
];
