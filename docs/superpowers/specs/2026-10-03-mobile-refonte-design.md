# Refonte de l'app mobile — conception

**Date** : 3 octobre 2026 · **Statut** : validée (arbitrages du 3 octobre) · **Surface** : mobile,
`shared`, API (deux lectures).

**Source** : le projet Claude Design
[`67fef5ec…`](https://claude.ai/design/p/67fef5ec-8471-41f4-87b3-177f329b7d2c) — *Système* (tokens,
typographie, composants, mouvement, micro-textes), *Refonte* (directions, navigation, parcours),
*Écrans* (chaque écran et ses états), *Prototype* (direction 1a cliquable). La direction retenue est
**1a « Carnet »**. Cette spec dit ce qu'on en garde, ce qu'on en change et pourquoi ; en cas de
désaccord entre la maquette et cette spec, **la spec fait foi**.

## But

L'app fonctionne mais manque d'identité et de hiérarchie : une suite de composants de même poids.
La refonte vise une app **propre**, au niveau d'exigence d'une app à beaucoup d'utilisateurs, même
si elle n'en a que deux ou trois : un système de design tenu, chaque écran dans ses états, aucune
exception aux règles de couleur.

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D101** | **Tokens par rôle, deux valeurs (sombre / clair)**, repris du *Système* : `bg.canvas`, `bg.surface-1..3`, `line.subtle/strong`, `ink.primary/secondary/tertiary/muted`, `action.bg/ink`, `record.ink/bg/line`, `danger.bg/ink`, `scrim`. `ink.muted` passe de `#6a717a` à `#7a818a` (4,0:1 → 4,9:1 sur le canevas) | CLAUDE.md impose un token par rôle et deux valeurs ; l'ancien `ink.muted` ne pouvait pas porter du texte |
| **D102** | **Le thème suit le système** (`useColorScheme`) ; `app.json` passe à `userInterfaceStyle: "automatic"`. Les styles se construisent depuis le thème courant (`creerStyles(t => …)` + `useStyles`), plus jamais par un `StyleSheet.create` au niveau du module | Un style figé au chargement ne peut pas changer de thème |
| **D103** | **Archivo** pour toute l'app, chargée par `expo-font` (`@expo-google-fonts/archivo` : 500, 600, 700, 800). Les chiffres héros (`display`, `chrono`) utilisent une **coupe condensée statique** (`wdth` 72, graisse 700) **générée** depuis la police variable officielle par `fonttools` (`scripts/polices/`), livrée en TTF avec sa licence OFL | React Native sur Android ignore les axes des polices variables ; aucune coupe condensée n'est publiée pour Expo |
| **D104** | **Échelle** : espacements en base 4 (4 → 48), marge d'écran 16 (20 en lecture), rayons 10 cellule · 14 bouton · 18 bandeau · 20 carte · 24 feuille · ∞ puce ; cible 48, ligne de série 52, cellule visible 40 + `hitSlop` 4 | Le *Système* ; la cible tactile ne rétrécit jamais |
| **D105** | **Un seul aplat lime par écran, sans exception.** La barre d'onglets n'en porte aucun ; « Terminer » est un bouton **secondaire** ; en séance, l'aplat est la ✓ de la prochaine série | La maquette exemptait la barre, d'où deux aplats sur l'Accueil et la page d'une routine |
| **D106** | **Navigation** : quatre onglets **Accueil · Routines · Stats · Profil**, sans lime ; **onglet actif en encre et en gras** (remplace D76 révisée). Le rond central disparaît. « Démarrer » vit sur l'Accueil (carte « À suivre », « Autre routine ou séance vide ») et sur la page d'une routine | Le rond mélangeait décor et action ; un aplat dans la barre doublait celui de l'écran |
| **D107** | **Bandeau « séance en cours »**, neutre (`surface-3`), au-dessus de la barre et, sur les écrans empilés, au-dessus de la zone de geste : nom, chrono ou « Repos 1:12 », chevron. **Tout le bandeau est appuyable** et ramène à la séance. Un seul mécanisme, sur tous les écrans hors séance et fin | La maquette avait deux mécanismes (bouton de barre, barre des écrans empilés) |
| **D108** | **Séance en cours, direction 1a** : en-tête (chevron qui replie, nom, « démarrée à », chrono, volume, séries), **puces** repos et note sous le nom (44 dp gagnés par exercice), ligne de série en quatre états (faite · faite avec record · prochaine · à venir), valeurs fantômes, une seule ✓ lime. **« Précédent » reste visible sur une série faite avec record** : le badge se place à côté des valeurs, il ne remplace pas la comparaison | La maquette remplaçait « Précédent » par le badge et perdait la comparaison |
| **D109** | **Pavé numérique intégré** (de la direction 1b) : appui sur kg ou reps → pavé dans la page, ±2,5 kg, « Suivant » (kg → reps), « Valider la série » ; le clavier système ne s'ouvre pas | Le geste le plus fréquent de l'app ; le clavier système masque la moitié de l'écran |
| **D110** | **Accueil** : « Cette semaine » (séances et volume, sept jours dans le **fuseau** de l'utilisateur), « À suivre » (la routine suivante, fonction pure de `shared` : celle qui suit la dernière routine faite dans l'ordre de la liste), « Dernières séances » avec le nombre de records. Le résumé d'une séance gagne `nbRecords` (API) | Les trois questions qu'on se pose en ouvrant l'app |
| **D111** | **Démarrer** devient une feuille basse ; **Fin de séance** liste les records battus ; un état « Pas encore de série » empêche d'enregistrer une séance sans série validée | La maquette |
| **D112** | **Stats**, calculées par l'**API** (`GET /stats`, dans le fuseau) : volume par semaine (8), régularité (12 semaines, jours entraînés), records récents, séries par muscle sur 4 semaines (carte du corps). Persistées dans le cache hors ligne (D96), affichées avec leur date | Une fonctionnalité neuve, pas un habillage ; l'historique n'est pas sur le téléphone (D96) |
| **D113** | **Mouvement et vibrations** selon le tableau du *Système* : on vibre pour confirmer une action faite sans regarder (valider, fin de repos, record), jamais pour décorer ; on anime pour montrer d'où vient un objet ; `useReducedMotion` remplace les déplacements par des fondus. **Réglage « Vibrations »** dans Profil, gardé sur le téléphone | Le *Système* |
| **D114** | **Micro-textes** du *Système* : tutoiement, phrases courtes avec un point, pas de point d'exclamation ; on décrit la situation, puis la suite | Le *Système* |

## Écarts assumés avec la maquette

- **Pas de bouton d'action dans la barre** (D105–D107), donc pas de réglage « bouton à gauche ».
- **Profil reste un onglet** : la file d'envoi y vit, et l'avatar de l'Accueil ne servait qu'à elle.
- **« Les modifications partent avec le prochain envoi »** (routines hors ligne) : retiré. La
  modification de routine hors ligne n'existe pas (hors périmètre de D96–D100).
- **« Le catalogue de 1 300 exercices est embarqué »** : il est mis en cache (D97), pas embarqué.

## Découpage

| Lot | Contenu | Dépend de |
|---|---|---|
| 1 | **Système** : tokens D101, thème clair / sombre D102, Archivo D103 ; tous les écrans passent aux nouveaux styles **sans changer de mise en page**. L'échelle D104, les vibrations D113 et les composants de base (boutons, puce, badge record, indicateur d'attente, état vide, feuille) arrivent **avec le premier lot qui s'en sert** : Knip refuse le code mort | — |
| 2 | **Navigation** D106–D107 | 1 |
| 3 | **Séance en cours** D108 | 1 |
| 4 | **Pavé intégré** D109 | 3 |
| 5 | **Accueil** D110 (dont `nbRecords` côté API) | 2 |
| 6 | **Démarrer et Fin** D111 | 2 |
| 7 | **Routines** : liste, page, édition | 1 |
| 8 | **Stats** D112 (route d'API comprise) | 1 |
| 9 | **Le reste** : connexion, détail d'une séance, fiche, choix d'exercices, Profil et réglage des vibrations | 1 |

Chaque lot : une branche, une PR, chaque écran vérifié sur l'émulateur dans ses états (vide,
chargement, erreur, hors ligne, nominal) **en sombre et en clair**.

## Hors périmètre

Supersets (lot B) ; routines modifiées hors ligne ; reprise automatique de la note de la dernière
fois ; minuteur de repos en notification système.
