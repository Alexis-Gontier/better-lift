# better-lift — Lot 3 : authentification

**Date :** 23 septembre 2026
**Portée :** Better Auth côté API, liste blanche d'inscription, connexion web et mobile.
**Critère de sortie :** connexion effective sur les deux surfaces, et la session mobile survit à
la fermeture de l'application.

Ce document complète la conception principale
[`2026-09-22-better-lift-redemarrage-design.md`](2026-09-22-better-lift-redemarrage-design.md),
dont la section 6 pose le cadre. Il ne la remplace pas : il tranche ce qu'elle laissait ouvert.
Le registre des décisions y continue, à partir de D30.

---

## 1. Ce qui était déjà décidé

La conception principale fixe quatre points, repris tels quels :

- **Instance unique côté API**, servant le cookie du web **et** le jeton porteur du mobile.
- **Inscription fermée par liste blanche**, vérifiée avant la création du compte. C'est le point
  de sécurité du projet : dans l'ancien dépôt, `/sign-up/email` est resté ouvert sur Internet.
- **Pas de vérification d'adresse e-mail** (D15) — trois adresses connues la rendent sans objet,
  et sa suppression évite un service d'envoi transactionnel.
- **Mobile par `@better-auth/expo`**, plugin officiel qui gère le stockage sécurisé du jeton.

En production, le SPA et l'API partagent une origine : **aucun CORS**. La configuration
d'origines de confiance ne sert qu'en développement, où Vite occupe le 3000 et l'API le 3001.

## 2. Ce que ce lot tranche

| | Décision | Pourquoi |
|---|---|---|
| **D30** | **La liste blanche mord sur `databaseHooks.user.create.before`**, pas sur `hooks.before` filtré par route | Un garde lié à une route ne couvre que cette route |
| **D31** | **E-mail et mot de passe seulement.** GitHub reporté | Un seul chemin de création de compte à garder |
| **D32** | **Session dans le contexte du routeur, garde en `beforeLoad`** | La redirection se décide avant tout rendu |
| **D33** | **Un seul écran `/connexion`**, portant connexion et création | Avec l'inscription close, l'exposer est sans risque — et c'est le seul moyen d'amorcer les comptes |
| **D34** | **Le mobile va jusqu'à la persistance au redémarrage**, pas au-delà | C'est le point jamais éprouvé ; le dessin attend le lot 6 |
| **D35** | **`estAutorisee` est une fonction pure dans `shared`** | Le seul endroit du lot où un test attrape vraiment quelque chose |
| **D36** | **Une seconde couleur, bornée au danger** (§ 5) — amende la ligne « une seule couleur » | Le lime porte déjà deux rôles ; un troisième casserait la distinction par la forme |

---

## 3. La liste blanche — le cœur du lot

### Le choix du point d'accroche

La documentation de Better Auth offre deux accroches pour refuser une inscription. Elles se
ressemblent et **ne se valent pas** :

```ts
// (a) Lié à UNE ROUTE.
hooks: {
  before: createAuthMiddleware(async (ctx) => {
    if (ctx.path !== "/sign-up/email") return;
    // …
  }),
}

// (b) Lié à LA CRÉATION D'UN UTILISATEUR, quel que soit le chemin.
databaseHooks: {
  user: { create: { before: async (user, ctx) => { /* … */ } } },
}
```

**Le lot retient (b).** La forme (a) a exactement la silhouette du défaut de l'ancien dépôt : le
jour où GitHub est ajouté, l'inscription par OAuth passe à côté du filtre — en silence, sans
erreur, sans test rouge — et personne ne s'en aperçoit avant qu'un inconnu ait un compte. Un
garde posé sur la création d'utilisateur ne peut pas être contourné par un chemin qu'on n'avait
pas prévu, y compris un chemin ajouté par un futur plugin.

La forme (a) est néanmoins ajoutée **en plus**, et uniquement pour l'ergonomie : elle permet de
rendre au formulaire un message lisible (« cette adresse n'est pas autorisée ») plutôt que
l'erreur générique remontée depuis la couche base. **La garantie vient de (b), jamais de (a).**
Si les deux devaient un jour diverger, c'est (a) qu'on supprime.

### La source de la liste

`SIGNUP_ALLOWLIST`, variable d'environnement déjà documentée dans `.env.example`, adresses
séparées par des virgules. Lue **une fois au démarrage**, normalisée — minuscules, espaces
retirés, entrées vides ignorées.

**Le démarrage échoue si la variable est absente ou si la liste normalisée est vide.** Une liste
blanche vide qui laisserait tout passer est le pire résultat possible : elle a l'apparence d'une
protection et n'en est pas une. Échouer bruyamment au démarrage est le seul comportement sûr.

Ajouter un compte se fait en changeant la variable et en redéployant. Pour deux ou trois comptes
sur la durée de vie du projet, c'est sans douleur — et ça évite une table, une migration et un
chemin d'administration que personne n'utiliserait.

### La comparaison

```ts
// packages/shared/src/allowlist.ts
export function normaliserListe(brut: string | undefined): string[];
export function estAutorisee(email: string, liste: string[]): boolean;
```

Comparaison **insensible à la casse**, sur adresse détourée. `Alexis@Gmail.com` et
`alexis@gmail.com ` désignent la même personne ; la liste ne doit pas dépendre de la façon dont
l'adresse a été tapée dans le formulaire.

Aucune tolérance en revanche sur les alias `+` ni sur les points de Gmail : `a+b@gmail.com`
n'est **pas** `a@gmail.com` pour ce lot. Les traiter comme équivalents demanderait de connaître
les règles de chaque fournisseur, et élargirait la liste blanche au lieu de la resserrer.

---

## 4. Le schéma

Les quatre modèles de Better Auth — `User`, `Session`, `Account`, `Verification` — entrent dans
`packages/db/prisma/schema.prisma`, **générés par la CLI de Better Auth** puis relus, jamais
écrits de mémoire. Une migration, appliquée sur la branche Neon `dev`.

`Verification` est conservé bien que la vérification d'adresse soit désactivée (D15) : Better
Auth s'en sert aussi pour la réinitialisation de mot de passe. La supprimer casserait un chemin
qu'on n'a pas encore écrit.

L'adaptateur reçoit l'instance déjà construite par `packages/db`, qui porte l'adaptateur pilote
`@prisma/adapter-pg` de Prisma 7 — il n'y a pas de second client à instancier.

---

## 5. Le web

### La session et la garde

`createAuthClient` de `better-auth/react`. La session est résolue **une fois**, au démarrage du
routeur, et posée dans son contexte. Une route de mise en page `_protege` porte un `beforeLoad`
qui redirige vers `/connexion` lorsqu'il n'y a pas de session, en emportant l'URL demandée pour
y revenir après connexion.

Les trois écrans du lot 2 — catalogue, routines, historique — passent sous cette mise en page.

Le point qui justifie ce choix plutôt qu'une garde dans le composant : **la redirection se
décide avant tout rendu**. Une garde qui s'exécute après le premier rendu peint l'écran puis le
fait disparaître — exactement le clignotement que le script synchrone du thème a servi à
supprimer au lot 1. Le faire réapparaître ici serait une régression visible.

Conséquence à accepter : le routeur attend la session avant de peindre. C'est un aller-retour
réseau au démarrage, sur une application privée où il n'y a rien à montrer avant.

### L'écran de connexion

Un seul écran, `/connexion`, portant les deux gestes : se connecter, créer un compte. Avec
l'inscription close par la liste blanche, exposer la création est sans risque — et c'est le seul
moyen d'amorcer les comptes, puisque rien d'autre ne les crée.

Il porte ses **quatre états** comme tout écran du projet, avec une nuance : ici, « erreur » n'est
pas un seul cas. Trois refus distincts doivent se lire différemment, parce qu'ils appellent trois
gestes différents :

| Refus | Ce que la personne doit comprendre |
|---|---|
| Identifiants faux | Réessayer, ou réinitialiser |
| Adresse hors liste blanche | Inutile de réessayer — cette adresse n'aura jamais de compte |
| API injoignable | Ce n'est pas toi, réessaie plus tard |

Confondre les deux premiers est le défaut classique : on laisse quelqu'un retaper dix fois un
mot de passe correct pour une adresse qui ne sera jamais acceptée.

### Le `destructive` en attente

Le formulaire de connexion est **le premier écran du projet à avoir besoin d'un état invalide**.
La question laissée en suspens au lot 2 — `destructive` n'est pas traduit dans `@theme inline`,
donc `aria-invalid` de `input.tsx` est sans effet, en silence — se tranche donc ici.

**D36 : une seconde couleur est introduite, strictement bornée au danger.** Un rouge sourd,
déclaré comme `destructive` / `destructive-foreground`, avec un invariant : **il ne porte jamais
l'action ni le record**, qui restent au lime. C'est précisément parce que le lime porte
déjà deux rôles — d'où la distinction par la forme, aplat contre contour — qu'il ne peut pas en
porter un troisième : un champ invalide cerclé de lime dirait « agis ici » au moment où il faut
dire « quelque chose ne va pas ».

La règle « ne jamais s'appuyer sur la couleur seule » continue de s'appliquer : l'erreur se dit
aussi en toutes lettres, et `aria-invalid` la porte pour les lecteurs d'écran. La couleur ne fait
que la rendre trouvable au premier coup d'œil.

C'est un **amendement à la ligne « une seule couleur » de la doctrine**, et c'est le seul point de
cette spec qui en modifie une. Il a été accepté le 23 septembre 2026. L'alternative écartée —
aucune seconde couleur, l'erreur portée par le texte et la forme seules — était tenable, mais
aurait rendu les confirmations destructrices des lots suivants (« supprimer cette séance »)
difficiles à distinguer d'une action ordinaire.

**Conséquence à porter dans `CLAUDE.md` au moment de l'implémentation**, et pas avant : la ligne
« une seule couleur » y devient « une seule couleur pour l'action et le record ; le danger a la
sienne, qui ne porte jamais ni l'une ni l'autre ». Tant que le token n'existe pas, écrire la
règle serait décrire du code absent.

---

## 6. Le mobile

`@better-auth/expo` en **1.7.5**, aligné sur `better-auth` 1.7.5. Le plugin serveur `expo()`
s'ajoute à l'instance ; le client mobile passe par `expoClient({ scheme, storagePrefix, storage })`
avec `expo-secure-store`.

Le schéma de l'application est **`better-lift`**, déjà déclaré dans `apps/mobile/app.json` — il
n'y a rien à inventer, et `trustedOrigins` doit porter `better-lift://`. En développement, les
origines `exp://` sont ajoutées **conditionnellement**, jamais en production.

Deux écrans, volontairement bruts : une connexion, et un écran derrière la session affichant qui
est connecté. Pas de cibles larges, pas de contraste renforcé, pas de quatre états — le dessin
mobile est le lot 6, et dessiner avant d'avoir appris de la saisie de séance serait l'inverse de
la méthode du projet.

**Le contrôle qui fait le lot :** se connecter, **tuer l'application**, la rouvrir — la session
tient, sans redemander le mot de passe. C'est l'un des deux points jamais éprouvés dans l'ancien
projet ; il se vérifie sur émulateur en deux minutes, et il ne se vérifie pas autrement.

Sur émulateur, l'API se joint en `http://10.0.2.2:3001` — `EXPO_PUBLIC_API_URL` le porte déjà.
Les dépendances Expo s'installent par `npx expo install`, jamais en recopiant une version.

---

## 7. Tests

**En TDD, parce qu'un test y attrape vraiment quelque chose :** `normaliserListe` et
`estAutorisee` dans `shared`. Les cas qui comptent — casse mélangée, espaces autour de l'adresse,
adresse absente, liste vide, variable absente, entrées vides dans la liste. Cette fonction est le
point de sécurité du lot réduit à du calcul pur ; c'est précisément ce que `shared` existe pour
porter.

**Testé côté API :** que `/sign-up/email` refuse une adresse hors liste, et l'accepte dedans.

**Vérifié en exécutant, pas en testant :** la garde web sans clignotement, la persistance du
jeton mobile au redémarrage, les trois refus distincts du formulaire. Aucun de ces trois ne se
voit à la lecture ni dans un test unitaire — c'est la leçon du lot 2, où `?etat=vide` affichait
l'erreur sans que rien ne le signale.

---

## 8. Pièges connus de ce lot

- **La CI n'a pas de base.** Toute étape qui charge la configuration Better Auth aura besoin des
  mêmes variables factices que `prisma generate` et `knip`. Le piège ne se voit pas en local, où
  le `.env` existe.
- **`BETTER_AUTH_SECRET` absent** fait échouer l'instance au démarrage, pas à la première
  requête. Bien pour la production, déroutant en CI si on ne l'a pas prévu.
- **Le port du rappel est celui de l'API (3001), jamais celui du web.** Erreur classique, déjà
  notée dans `.env.example`.
- **La clé de cache de la session** suit la règle générale du projet : toute donnée présente dans
  la clé de lecture doit l'être dans la clé d'écriture. Une déconnexion qui ne vide pas le cache
  laisse l'ancienne session à l'écran.
- **`expo-secure-store` s'installe par `npx expo install`**, comme toute dépendance Expo. Ne pas
  transposer la règle de MMKV — « aucun plugin de configuration » — sans avoir lu la
  documentation du paquet : c'est une règle propre à MMKV, pas une règle générale.

---

## 9. Hors périmètre

Reporté, et pourquoi :

- **GitHub OAuth** (D31) — ajoutable plus tard sans rien casser, puisque le garde est posé sur la
  création d'utilisateur et non sur une route. Demandera une seconde URL de rappel, une OAuth App
  n'en acceptant qu'une.
- **Réinitialisation de mot de passe** — demande un envoi d'e-mail, que D15 a justement supprimé
  du projet. À reprendre le jour où le besoin se présente réellement.
- **Rôles et permissions** — deux ou trois comptes, tous égaux.
- **Le dessin des écrans mobiles** — lot 6.
- **`packages/api-client`** — l'extraction reste prévue au lot 4, quand le catalogue donnera aux
  deux surfaces les mêmes routes à consommer.
