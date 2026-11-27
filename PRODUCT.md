# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

- **Le pratiquant**, d'abord l'auteur du projet, puis une dizaine de personnes au plus. Il suit ses
  propres routines (push, pull, full body, jambes), choisit sa séance le jour même sans rien
  planifier, s'entraîne téléphone en main entre deux séries, et veut savoir quoi charger. Il
  connaît ses exercices ; il ne cherche ni programme tout fait, ni coach, ni réseau social.
- **Le visiteur du dépôt** : quelqu'un qui découvre le projet sur GitHub (projet d'étudiant). Il
  doit pouvoir télécharger l'app, ouvrir le web, créer un compte et s'en servir sans aide, et
  juger le travail sur ce qu'il voit.

## Product Purpose

Un carnet de musculation en français : préparer ses routines, les suivre en salle série par
série, relire ses séances et ses progrès. C'est un projet d'étudiant, gratuit, sans visée
commerciale. Réussite : une séance se lance et se saisit sans friction, hors réseau compris, et un
inconnu comprend l'app seul.

## Positioning

Pas de positionnement commercial face à Hevy ou Strong : better-lift existe pour être utilisé par
son auteur et montré. Ce qui le distingue en pratique : entièrement en français, gratuit, sans
publicité ni abonnement, code ouvert.

## Operating Context

- **Mobile (Android)** : la salle. Écran tenu d'une main, entre deux séries, souvent sans réseau ;
  la séance vit sur le téléphone et part au serveur quand le réseau revient. Notification de repos.
- **Web** : préparer au calme et relire, au clavier.
- Distribution : APK publié dans les releases GitHub, mises à jour par `eas update`. Pas d'iOS
  pour l'instant.

## Capabilities and Constraints

- Routines (en dossiers) créées et modifiées sur les deux surfaces ; séance depuis une routine ou
  libre ; séries normales, échauffement, dégressives ; supersets ; repos par exercice ; recopie de
  « la dernière fois » ; records et totaux dérivés à la lecture ; historique ; fiche d'exercice ;
  catalogue de 1 316 exercices ; export CSV.
- Pas de planning de la semaine : l'objectif hebdomadaire est un compte de séances. La progression
  automatique (règles de charge) est hors de la refonte actuelle.
- Kilos et fuseau de Paris pour tous, pour l'instant.
- Inscription ouverte prévue, une fois la vérification d'e-mail et les limites d'inscription
  livrées ; d'ici là, liste d'adresses autorisées.
- Vocabulaire : séance, routine, série, échauffement (É), dernière fois, record, commencer,
  terminer, abandonner, repos, réglages.

## Brand Commitments

- Nom : better-lift, en minuscules.
- Tout en français, tutoiement sur mobile.
- Le logo actuel « La charge » (trois disques et une barre courte en diagonale à 45°) est apprécié
  mais pas définitif : il peut changer avec la nouvelle identité.

## Evidence on Hand

- Données réelles d'un seul pratiquant (5 séances d'octobre 2026) ; compte de démonstration sur la
  branche Neon `dev`.
- Aucun témoignage, aucun chiffre d'utilisateurs, aucune presse : ne pas en inventer.

## Product Principles

1. La salle d'abord : la séance se lance et se saisit d'une main, sans réseau.
2. Un seul chemin et un seul nom par chose, sur les deux surfaces.
3. Se suffire : un inconnu installe, s'inscrit et s'entraîne sans aide.
4. Moins de code : pas de fonction sans usage, pas de SaaS.

## Accessibility & Inclusion

Contraste AA vérifié par `pnpm lint` (`scripts/contrastes.mjs`) ; cibles tactiles d'au moins
44 px ; thèmes sombre et clair.
