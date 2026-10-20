# Mobile repris de zéro : écrans simplifiés, style « wireframe »

Chantier du 2026-10-20. Le web est bon pour le MVP ; le mobile repart de zéro pour le style et se
simplifie avant l'épreuve du jalon. La direction artistique (couleurs, icône, typographie) viendra
**une fois l'app construite**, comme sur le web.

## Ce qui est décidé

- **Référence : Hevy, en plus dépouillé.** Mêmes parcours, le strict minimum par écran.
- **Le mobile devient l'outil de salle pur.** Le web prépare et relit. Sont retirés du mobile :
  - l'édition des routines (éditeur ; le choix et la réorganisation d'exercices ne restent que
    pour la séance) — révise D82 ;
  - la page d'une routine et sa carte du corps — révise D83, D84, D122, D172 ;
  - la fiche d'un exercice (1RM, courbe, records, historique) — révise D124, D174 ;
  - le Profil complet : il ne garde que thème, repos par défaut, vibrations, déconnexion — révise
    D128, D175. Bilan, objectif hebdomadaire et export restent au web.
- **Écrans restants** : connexion, accueil, séance (avec ajout, remplacement et réorganisation
  d'exercices), fin de séance, Profil.
- **Navigation : un seul écran d'accueil, sans barre d'onglets** — révise D74, D120, D165, D171,
  D178. L'accueil :
  - en-tête « Routines » et une icône Profil ;
  - « Séance vide » en tête ;
  - la liste des routines (nom, nombre d'exercices, durée estimée) : **appuyer lance la séance** ;
  - un bandeau « Séance en cours · Reprendre » en bas quand une séance est ouverte.
- **Base visuelle : React Native Reusables** (le shadcn de React Native), palette `neutral`,
  tokens en variables CSS (`background`, `foreground`, `primary`, `muted`, `border`,
  `destructive`…), deux registres sombre / clair, **police système**. Pas de logo : le nom en
  texte, comme sur le web (D229). Révise D101, D103, D104, D118, D161–D164, D176 et
  `lib/palette.ts`.
- **Moteur de styles** : **Uniwind** (Tailwind 4, la version du web) s'il tourne dans Expo Go
  SDK 57 ; sinon **NativeWind**. Tranché par un essai au début du lot 1. Les deux restent au
  niveau de Babel et Metro ; Reanimated est déjà dans Expo Go : D80 tient.

## Ce qui ne bouge pas

La logique, qui ne connaît pas l'interface : `lib/seance.tsx`, `lib/requetes.ts`,
`lib/hors-ligne.ts`, la file d'envoi, `lib/notification-repos.ts`, `lib/vibrations.ts`,
`lib/stockage.ts`, `lib/theme-choix.ts`, l'authentification, et tout `packages/shared`. Les
règles de fond tiennent : `formaterCharge` / `lireCharge`, fuseau et unités dans `lib/unites.ts`
et `lib/fuseau.ts`, quatre états par écran, cibles tactiles de 48, taille du texte du système
suivie, `ErrorBoundary`.

## Approche : réécriture en place, lot par lot

Sur `apps/mobile`, une PR par lot, comme les six lots de nettoyage du web (#103–#108). Chaque
écran se dessine avec ses quatre états avant d'être branché ; chaque lot finit par `/verif` vert
et une capture sur l'émulateur, en sombre et en clair.

### Lot 1 — socle et coquille

1. Essai Uniwind dans Expo Go ; repli NativeWind. Installer Reusables (`components.json`, `cn`,
   `PortalHost`, tokens `neutral`), et seulement les composants dont le lot se sert.
2. Brancher le choix du thème (Système · Sombre · Clair, `lib/theme-choix.ts`) sur le registre
   de Reusables.
3. Retirer d'un coup : `(onglets)` et sa barre, la page d'une routine, `routine-edition`, la fiche
   d'un exercice et ses composants, `feuille-demarrer`, la carte du corps
   (`react-native-body-highlighter`), Barlow (`@expo-google-fonts/*`), `logo.tsx`. Knip doit
   rester vert.
4. Refaire la connexion (le nom en texte, sans accroche) et le nouvel accueil.
5. Tant que les lots 2 et 3 ne sont pas faits, la séance, la fin et le Profil gardent leur code
   actuel. L'ancien thème (`lib/theme.ts`, `lib/palette.ts`) reste pour eux, **passé au gris**
   (valeurs `neutral`, police système, plus d'affiche) : un doublon provisoire des tokens de
   `global.css`, supprimé au lot 3 avec son dernier usage.

### Lot 2 — la séance

Écran de séance, lignes de série, repos, ajout / remplacement / réorganisation d'exercices,
supersets. Le détail (pavé numérique maison ou clavier du système, place du repos) se tranche en
dessinant l'écran au début du lot.

### Lot 3 — fin de séance et Profil

Fin de séance (bilan, records de la séance, enregistrer). Profil minimal : thème, repos par
défaut, vibrations, déconnexion ; la file d'envoi reste visible quand une séance attend.

## Documentation

À la fusion de chaque lot : une décision **D316 et suivantes** dans `docs/decisions.md`, sur le
modèle de D178 (ce qui est retiré, ce qui reste dans `shared`), les décisions révisées marquées
comme telles ; `docs/conception.md` (tableau des surfaces, architecture du mobile) et
`.claude/rules/mobile.md` réécrits. Une fois le chantier fusionné, cette spec et son plan sont
supprimés.

## Hors périmètre

La direction artistique (couleur d'accent, icône, écran de démarrage, typographie) : après l'app
construite. Aucun changement d'API ni de base.
