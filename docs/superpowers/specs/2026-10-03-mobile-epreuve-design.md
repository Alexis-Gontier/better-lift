# Mobile prêt pour l'épreuve — conception

**Date** : 3 octobre 2026 · **Statut** : validée · **Surface** : mobile (Expo Go), `shared`, API
(un champ du résumé d'exercice).

Plan : [`2026-10-03-mobile-epreuve.md`](../plans/2026-10-03-mobile-epreuve.md).

## But

Le § 2 de la conception promet, pour le premier jalon, un « fonctionnement hors ligne intégral »,
et le § 12 une « synchronisation au retour du réseau ». L'audit du 3 octobre a trouvé trois trous
qui empêchaient d'abandonner Hevy en salle : démarrer une routine exigeait le réseau, ajouter un
exercice aussi, et une séance terminée hors ligne attendait le prochain lancement de l'app pour
partir. L'historique, lui, était injoignable sur le mobile (onglet masqué, aucun lien).

## Décisions

| # | Décision | Pourquoi |
|---|---|---|
| **D95** | **L'Accueil est le fil des séances** (la liste de l'historique). Le détail reste `/historique/[id]` ; le nom d'un exercice y mène à sa fiche `/exercices/[slug]`, qui porte ses records. Les onglets reviennent en arrière **par l'historique** (`backBehavior="history"`) | L'Accueil était vide et l'historique injoignable. C'est l'accueil de Hevy. Sans `history`, le retour depuis une fiche sautait le détail et ramenait à l'Accueil |
| **D96** | **Cache de requêtes persistant**, une clé AsyncStorage `better-lift:cache-requetes`, une semaine, **filtré** : routines (liste et détails), catalogue complet, précédents. L'historique n'y entre pas. Le filtre porte sur la **présence d'une donnée**, pas sur le statut. La déconnexion efface aussi ce cache | Démarrer hors ligne exige ces trois lectures ; l'historique grossit sans fin et une ligne AsyncStorage Android plafonne vers 2 Mo. Un rafraîchissement raté hors ligne passe la requête en erreur en gardant sa donnée : un filtre sur `success` l'effaçait du disque |
| **D97** | **Le catalogue complet descend une fois** (pages de 100, ~1 300 exercices, ~470 Ko) et se **filtre sur le téléphone** par `filtrerCatalogue` de `shared`. Le résumé d'un exercice porte `recherche` (la colonne `nomRecherche`) | Ajouter un exercice en salle sans réseau ; garder la recherche française ET anglaise (D44) sans dupliquer la normalisation |
| **D98** | **Démarrer lit réseau d'abord, cache en repli**, sous un délai (4 s la routine, 3 s les précédents) ; **directement le cache** quand l'app se sait hors ligne. Sans cache : la routine est indisponible, les précédents sont vides | En mode avion, une requête attend son délai entier avant d'échouer : l'appui coûtait 7 s. Un réseau « connecté mais lent » ne doit pas figer l'appui |
| **D99** | **L'envoi se relance seul** au retour du réseau (`expo-network` → `onlineManager`, état de départ compris) et au retour de l'app au premier plan (`AppState`) | Jusqu'ici : au lancement, à la fin d'une séance, ou à la main. Sans l'état de départ, TanStack Query se croyait en ligne jusqu'au premier changement de réseau |
| **D100** | **La garde de session ne renvoie à la connexion que sur une absence de session confirmée**, jamais sur une erreur de lecture | Hors ligne, une garde trop zélée rendrait la séance en cours inaccessible en salle. Better Auth Expo réhydrate déjà sa copie de la session ; la garde ne dépend plus de ce détail |

## Ce que l'émulateur a appris

- **Une lecture sans réseau se met en pause, elle n'échoue pas** (`fetchStatus === "paused"`,
  `isPending` vrai). Tout écran qui ne teste que `isPending` tourne alors pour toujours : l'Accueil,
  « Démarrer » et le catalogue ont un état « Hors ligne ».
- **Un écran montre la donnée qu'il a avant l'erreur** (`isError && !data`) : en TanStack Query 5,
  une donnée en cache dont le rafraîchissement a raté est en état d'erreur.
- **Une relecture du brouillon ne doit pas écraser un changement survenu pendant qu'elle lisait**
  (`lib/seance.tsx`, compteur d'écritures). Au retour de la modale du catalogue, l'ajout
  d'exercices, devenu instantané hors ligne, précédait la relecture lancée par le retour à l'écran ;
  l'écran réaffichait l'ancienne séance, et la modification suivante aurait perdu l'ajout sur le
  disque.
- **Expo Go ne démarre pas à froid en mode avion.** Le démarrage à froid hors ligne ne s'éprouve
  donc que sur l'APK ; sur l'émulateur, on coupe le réseau app ouverte puis on recharge le JS
  (menu de dev → Reload), ce qui rejoue la restauration du cache.

## Hors périmètre

Historique hors ligne ; précédents d'un exercice ajouté qui n'a jamais été lu en ligne ; routines
créées ou modifiées hors ligne ; images d'exercices jamais affichées en ligne (le cache disque
d'`expo-image` ne garde que ce qu'il a vu).
