"use client";

import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@better-lift/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@better-lift/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@better-lift/ui/components/sidebar";
import { Skeleton } from "@better-lift/ui/components/skeleton";

import { useSignOut } from "@/features/auth/use-sign-out";
import { useSession } from "@/lib/auth-client";

const THEMES = [
  { value: "system", label: "Système", icon: MonitorIcon },
  { value: "light", label: "Clair", icon: SunIcon },
  { value: "dark", label: "Sombre", icon: MoonIcon },
] as const;

/**
 * Initiales de repli, en attendant que le profil porte un avatar.
 *
 * L'e-mail sert de source parce que c'est la seule donnée dont on est sûr :
 * `name` peut être vide chez qui s'est inscrit sans le renseigner.
 */
function initials(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Pied de sidebar : qui est connecté, et les trois choses qu'on veut atteindre
 * depuis n'importe quel écran — les réglages, le thème, la sortie.
 *
 * La bascule de thème vit ici et non dans la topbar. La doc 05 la destine à
 * « Réglages › Préférences », ce qui reste vrai — mais un thème se règle en
 * regardant l'écran qu'il change, pas depuis une page de formulaire. Les deux
 * emplacements écriront la même préférence.
 */
export function UserMenu() {
  const session = useSession();
  const signOut = useSignOut();
  const { theme, setTheme } = useTheme();
  const { isMobile } = useSidebar();

  /*
    Le thème n'est pas connu au rendu serveur — il vient de `localStorage` ou
    du média. Même précaution que dans `theme-toggle.tsx` : on n'affiche l'état
    coché qu'une fois monté, sinon il est faux la moitié du temps.
  */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (session.isPending) {
    /*
      Squelette écrit à la main plutôt que `SidebarMenuSkeleton` : celui-ci tire
      une largeur au hasard dans son initialiseur d'état, donc une au serveur et
      une autre au client. La session étant `isPending` des deux côtés, c'est
      exactement ce squelette qui serait hydraté — et l'écart déclencherait une
      erreur d'hydratation à chaque chargement.
    */
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex h-12 items-center gap-2 px-2">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="grid flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const user = session.data?.user;

  /*
    Pas de session : `proxy.ts` l'a normalement déjà écarté, mais le cookie peut
    avoir expiré pendant que l'onglet était ouvert. Un lien plutôt qu'un menu
    vide — et surtout pas un plantage sur `user.email`.
  */
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Se connecter">
            <Link href="/login">
              <LogOutIcon />
              <span>Se connecter</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const displayName = user.name?.trim() || user.email;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/*
              Pas de `tooltip` ici, contrairement aux entrées de navigation :
              avec cette prop, `SidebarMenuButton` s'enveloppe lui-même dans un
              `<Tooltip><TooltipTrigger asChild>`, et c'est ce `Tooltip` — qui
              n'est pas un élément du DOM — que `DropdownMenuTrigger asChild`
              recevrait. Le menu ne s'ouvrirait plus. Le nom reste de toute
              façon en tête du menu déroulé.

              `size="lg"` : c'est la seule cible du pied de sidebar, et elle
              porte deux lignes de texte.
            */}
            <SidebarMenuButton size="lg" aria-label={`Compte de ${displayName}`}>
              <Avatar className="size-8 rounded-lg">
                {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                <AvatarFallback className="rounded-lg">
                  {initials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>

              {/*
                `min-w-0` sur le conteneur **et** `truncate` sur chaque ligne :
                sans le premier, un e-mail long pousse la colonne au lieu d'être
                coupé, et la sidebar déborde de sa largeur fixe.
              */}
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>

              <ChevronsUpDownIcon className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/*
            Le menu s'ouvre au-dessus sur mobile, où le pied de tiroir est déjà
            en bas d'écran, et à droite sur grand écran. `--radix-popper-anchor-width`
            l'aligne sur la largeur du déclencheur plutôt que sur son contenu.
          */}
          <DropdownMenuContent
            align="end"
            side={isMobile ? "top" : "right"}
            sideOffset={4}
            className="w-(--radix-popper-anchor-width) min-w-56 rounded-lg"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="grid min-w-0 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/settings">
                <SettingsIcon />
                Réglages
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs text-muted-foreground">Thème</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={mounted ? (theme ?? "system") : undefined}
              onValueChange={setTheme}
            >
              {THEMES.map(({ value, label, icon: Icon }) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  <Icon />
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
              <LogOutIcon />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
