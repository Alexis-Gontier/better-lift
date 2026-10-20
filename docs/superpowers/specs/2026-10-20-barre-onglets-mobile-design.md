# Barre d'onglets du mobile — design (D319)

Document de chantier. Une fois fusionné : D319 dans `docs/decisions.md`, la section Navigation
de `.claude/rules/mobile.md` à jour, puis supprimer cette spec et son plan.

## Pourquoi

D316 a retiré la barre d'onglets : un seul accueil, le Profil par une icône d'en-tête. On la
remet, en wireframe gris, pour trois destinations — le cas idéal de Material 3 (3 à 5
destinations, libellés toujours visibles) et d'Apple (des onglets pour naviguer, jamais pour
agir : pas de rond « Démarrer » central comme D165).

Références : Hevy (« Séance vide » en tête de l'onglet d'entraînement, séance en cours au-dessus
de la barre), Strong et Fitbod (un onglet pour l'historique).

## Décisions

- **Onglets : Routines · Historique · Profil**, dans cet ordre, libellés toujours visibles.
  Icônes Lucide : `Dumbbell`, `History`, `User`.
- **Historique : l'onglet seul pour l'instant.** Son écran montre un état vide, sans requête.
  La liste et le détail des séances viendront dans un autre chantier (l'API a déjà
  `GET /seances` et `GET /seances/:id`).
- **« Séance vide »** reste en tête de l'onglet Routines.
- **Le bandeau « Reprendre »** passe au-dessus de la barre et se voit sur les trois onglets.
- **Style : la pilule de Material 3.** L'onglet actif porte une pilule `bg-secondary` de 64 × 32
  derrière son icône et un libellé en gras `text-foreground` ; les autres sont en
  `text-muted-foreground`. Filet `border-border` en haut de la barre. La forme marque l'onglet
  actif, pas la couleur. Pas d'animation.
- **`Tabs` d'Expo Router avec une barre à nous**, pas `NativeTabs` : `NativeTabs` n'accepte pas
  Lucide (Material Symbols ou images) et ne pose rien au-dessus de la barre sous Android
  (`BottomAccessory` est réservé à iOS 26). La prop `tabBar` de `Tabs` rend un seul composant
  pour le bandeau et la barre.

## Structure

```
app/(connecte)/
  _layout.tsx    garde de session + PreparerHorsLigne + <Tabs tabBar={BarreOnglets}>
  index.tsx      Routines (sans icône Profil ni bandeau)
  historique.tsx nouveau : titre + état vide
  profil.tsx     titre simple au lieu d'EnteteRetour
components/
  barre-onglets.tsx  nouveau : BandeauSeance puis la barre
```

- Pas de groupe de routes ajouté : `(connecte)/_layout.tsx` remplace sa `Stack` par `Tabs`
  (`headerShown: false`).
- `seance`, `fin`, `choisir-exercices`, `reorganiser` restent sur la pile racine, par-dessus les
  onglets : la barre disparaît pendant la séance sans code.
- Retour Android depuis Historique ou Profil : vers Routines (`backBehavior` par défaut,
  `firstRoute`).

## `BarreOnglets`

- Reçoit les props de la barre (`state`, `descriptors`, `navigation`). `expo-router` n'exporte
  pas `BottomTabBarProps` à sa racine et `@react-navigation/*` ne s'importe plus en direct
  (SDK 56+) : le type se dérive de `Tabs`,
  `Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0]`.
- Rend `<BandeauSeance />` (rien sans séance en cours), puis la barre.
- La barre : `View` `flex-row border-t border-border bg-background`, `paddingBottom` égal à
  l'encart bas (`useSafeAreaInsets`), `accessibilityRole="tablist"`.
- Un onglet : `Pressable` `flex-1 items-center justify-center gap-1`, hauteur minimale de 64,
  `accessibilityRole="tab"`, `accessibilityState={{ selected }}`, `accessibilityLabel` = libellé.
  L'icône (`Icon as={…} className="size-6"`) dans une `View` `h-8 w-16 rounded-full`
  (`bg-secondary` si actif) ; le libellé `text-xs`.
- Appui : `navigation.emit({ type: "tabPress", target, canPreventDefault: true })`, puis
  `navigation.navigate(route.name)` si l'onglet n'est pas actif et que l'évènement n'a pas été
  empêché. Appuyer sur l'onglet actif ne fait rien.
- Libellés et icônes : une table locale par nom de route (`index`, `historique`, `profil`).

## Écrans

- `index.tsx` : retirer le bouton Profil de l'en-tête et `<BandeauSeance />` ;
  `edges={["top"]}`.
- `profil.tsx` : `EnteteRetour` remplacé par un titre `h-14 px-4 text-2xl font-semibold`,
  `accessibilityRole="header"` ; `edges={["top"]}`.
- `historique.tsx` : même titre « Historique », puis `<Vide>` (« Tes séances passées
  apparaîtront ici. ») ; `edges={["top"]}`.
- `BandeauSeance` garde son `mb-2` : il se pose au-dessus du filet de la barre.

## Décisions et docs à écrire

- **D319** dans `docs/decisions.md` ; « *Révisée par D319* » sur D316 et D107.
- `.claude/rules/mobile.md`, section Navigation : trois onglets, `BarreOnglets`, bandeau au-dessus
  de la barre, Historique vide pour l'instant.

## Vérification

- `/verif` vert.
- Captures sur l'émulateur, sombre et clair : chacun des trois onglets ; Routines avec une séance
  en cours (bandeau au-dessus de la barre) ; la séance ouverte (barre absente).
- Retour Android depuis Historique et Profil : ramène à Routines.
- Hors périmètre : le contenu de l'Historique, les animations, les badges.
