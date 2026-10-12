# Thèmes interchangeables, thème Basic-Fit, clavier en séance — conception

**Date** : 13 octobre 2026 · **Statut** : validée · **Surface** : mobile seulement.

## But

L'utilisateur changera **régulièrement** d'interface : l'app doit le permettre en un seul endroit,
sans fouiller les écrans. Premier thème posé sur ce socle : **Basic-Fit, façon app mobile**
(orange sur fond sombre). En séance, la saisie passe au **clavier du téléphone**.

## Recherche

- **Basic-Fit** : variables CSS de `basic-fit.com` (`global.css`, octobre 2026). Orange de marque
  `#eb6800` (survol `#bd5400`, pâle `#fff6f0`), oranges secondaires `#ff8712` / `#ffab21`,
  interaction **violette** `#592bb2`, fonds sable `#fbf7f0` / `#f2e8d6` / `#e8d6bf`, texte
  `#2d2d2d` / `#6b6b6b`, danger `#c73326`, rayons 2 · 4 · 6 · 8 · 12. Police **Heading Pro
  Treble** (commerciale, non embarquable) : **Archivo** en est la plus proche en libre.
- **Contraste** : le blanc sur `#eb6800` ne tient pas 4,5:1 ; l'orange vif en texte sur fond
  clair non plus (~2,8:1).

## D182 — Un fichier par thème

- **`apps/mobile/themes/<nom>/`** : `couleurs.ts` (TypeScript pur : `sombre` et `clair` de type
  `Couleurs`, testables sous Node) et `index.ts` (le thème complet : couleurs, polices, rayons,
  style d'affiche).
- **`themes/index.ts`** recense tous les thèmes (aucun n'est du code mort, Knip reste muet) ;
  **`lib/theme-actif.ts`** en choisit un, en une ligne. Les anciens thèmes restent pour revenir
  en arrière.
- **Un thème change** : couleurs (sombre et clair, mêmes rôles que `Couleurs`), polices (fichiers
  à charger, nom de chaque graisse et de l'affiche), rayons (`cellule`, `bouton`, `bandeau`,
  `carte`, `feuille`), style d'affiche (casse, interlettrage). **Restent communs** : espacements,
  tailles de texte, `CIBLE`, `PLAFOND_TEXTE_DENSE` — des contraintes d'ergonomie en salle.
- **Les écrans ne changent pas** : `lib/theme.ts` garde son API (`useCouleurs`, `creerStyles`,
  `polices`, `rayon`, `affiche`, `taille`, `espace`) et lit le thème actif. `app/_layout.tsx`
  charge les polices du thème actif. `lib/palette.ts` disparaît : `Couleurs` vit dans
  `themes/type.ts`.
- **Garde-fous** : `palette.test.ts` vérifie chaque thème (même règles qu'aujourd'hui) ; un test
  échoue si une couleur littérale (`"#…"`, `rgba(`) apparaît dans `app/`, `components/` ou `lib/`
  hors des thèmes.
- **Underground orange** (D161) devient `themes/underground/`, à l'identique.

## D183 — Le thème Basic-Fit, façon app mobile

- **Sombre d'abord** : canevas quasi noir, cartes anthracite, encre blanche ; **l'orange
  `#eb6800` porte l'action** (aplat, texte foncé), le record (contour) et l'onglet actif. Danger
  dérivé de `#c73326`, éclairci pour se lire sur le noir.
- **Clair** sur les fonds sable de Basic-Fit (`#fbf7f0`), texte `#2d2d2d`, orange foncé `#bd5400`
  pour l'orange en texte. Le réglage Système · Sombre · Clair (D128) continue de marcher.
- **Pas de violet** : une seule couleur d'action (invariant de l'app).
- **Polices** : Archivo Black pour l'affiche (titres, noms en tête, chrono, records), Archivo
  400–700 pour le reste.
- **Rayons** de l'échelle Basic-Fit : cartes 12, boutons, cellules et bandeaux 8, feuilles 16.
- Valeurs exactes fixées à l'implémentation sous la contrainte du test de contraste.
- **Thème actif : Basic-Fit.**

## D184 — Le clavier du téléphone en séance (révise D109)

- Les cases kg et reps deviennent des **`TextInput`** : kg en `decimal-pad` (lu par `lireCharge`,
  « , » comme « . »), reps en `number-pad`. « Suivant » passe de kg à reps ; sur reps, le clavier
  se ferme.
- Une saisie invalide n'est jamais écrite ; la cible reste en valeur fantôme (`placeholder`) ;
  `saisi` marque ce qui a été tapé (inchangé). Valider la série reste la case ✓.
- La ligne en saisie défile au-dessus du clavier.
- **Disparaissent** : `components/seance/pave-numerique.tsx`, les ±2,5 kg, « Valider la série » du
  pavé, le `BackHandler` du pavé ; dans `shared/pave.ts`, ce qui n'a plus d'appelant.
- On accepte que le clavier masque le bas de l'écran (raison de D109).

## Ordre

Trois commits sur `feat/mobile-mvp-pages` : le socle (aucun changement visible), le thème
Basic-Fit, le clavier. Chacun vérifié sur l'émulateur, en sombre et en clair.
