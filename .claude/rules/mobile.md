---
paths:
  - "apps/mobile/**"
---

# Mobile — Expo SDK 57

- Expo Router. **Development build obligatoire**, jamais Expo Go : SecureStore, MMKV, notifications et Better Auth exigent du natif.
- **NativeWind v4 + Tailwind 3** ici, alors que le web est en Tailwind 4. C'est volontaire : NativeWind v5 est encore en preview. Les tokens de design partagés viennent de `packages/config`.
- **`platforms: ["ios", "android"]` dans `app.json` — ne pas ajouter `"web"`.** La plateforme web d'Expo repose sur `react-native-web`, interdit par la règle non négociable n°2. Sans cette restriction, une simple requête d'un navigateur sur le port de Metro déclenche un bundle web qui échoue sur `react-native-web/dist/exports/...` **et arrête le serveur de développement** — l'erreur ne ressemble alors en rien à sa cause.
- `localhost` désigne le téléphone, pas la machine de dev. L'URL d'API vient de `EXPO_PUBLIC_API_URL` (IP LAN). Émulateur Android : `10.0.2.2`.
- **`EXPO_PUBLIC_*` doit vivre dans `apps/mobile/.env`, pas à la racine du monorepo.** Expo ne lit que le `.env` de son propre dossier ; une valeur placée à la racine est ignorée sans avertissement et le bundle retombe sur la valeur de repli du code. Après tout changement, relancer Metro avec `--clear` : le cache conserve les valeurs inlinées précédentes.
- En V0, aucune dépendance native ne sort de ce qu'embarque Expo Go. Le development build redevient obligatoire dès que Better Auth, SecureStore ou MMKV entrent en jeu.
- `FlashList` pour les longues listes (le catalogue fait 1 324 exercices).

## Séance active — le cœur du produit

- État persisté en **MMKV** (écritures synchrones : aucune fenêtre de perte si l'app est tuée entre deux séries). Pas AsyncStorage.
- Le chrono se calcule depuis `startedAt`. **Jamais un `setInterval` incrémental** : il dérive dès le passage en arrière-plan.
- La colonne « précédent » pré-remplit les champs avec la dernière performance. Dans le cas nominal l'utilisateur ne tape rien, il coche.
- Valider une série = un seul geste, avec retour haptique.
- `✕` ne quitte jamais directement : proposer « Reprendre plus tard » ou « Abandonner ».
- Au démarrage, chercher un brouillon actif et proposer de reprendre.

## Réseau

Le hors ligne est un cas nominal, pas une dégradation. Une séance se remplit intégralement sans réseau ; l'envoi part à la reconnexion via une file de retry avec backoff. L'idempotence par identifiant client rend un rejeu inoffensif.

## Auth

`@better-auth/expo` en mode bearer, token dans `expo-secure-store`. Nécessite `expo-secure-store` **et** `expo-network`. Le scheme de l'app doit figurer dans `trustedOrigins` côté serveur.

Sur `401` : purge de SecureStore et du cache, déconnexion propre, sans boucle de redirection.

Détail des écrans : `docs/06-app-mobile.md`.
