# Web : Neobrutalism, light seulement, auth minimale, Accueil vidé

Le 14 octobre 2026. Premier lot du chantier web porté par la branche `feat/web-refonte`, qui
accueillera ensuite les changements de barre latérale, de mise en page et des pages.

Les numéros D185–D192 ont servi à la PR #119 (tableau de bord 2a, thème shadcn par défaut),
fermée sans fusion ; D179–D184 sont pris par le mobile sur `feat/mobile-mvp-pages`. Ce chantier
commence donc à **D193**.

## D193 — Le web passe au Neobrutalism, palette Orange

Révise D135 (police et tokens repris du mobile), D177 et D192 (thème du web).

Le web prend la palette **Orange** de [neobrutalism.dev](https://www.neobrutalism.dev) :

| Rôle | Valeur |
|---|---|
| Fond de page (`--background`) | `hsl(33 100% 92%)` (crème) |
| Fond secondaire (`--secondary-background`) : champs, cartes, menus | `#ffffff` |
| Couleur principale (`--main`), texte dessus (`--main-foreground`) | `#FF7A05`, `#000000` |
| Encre (`--foreground`), bordure (`--border`), anneau de focus (`--ring`) | `#000000` |
| Ombre (`--shadow`) | `4px 4px 0 0 var(--border)` |
| Rayon (`--radius-base`) | `5px` |
| Graisses | `500` pour le texte, `700` pour les titres |

**Méthode : nos primitives sont réhabillées, pas remplacées.** Les composants de neobrutalism.dev
reposent désormais sur `@base-ui/react` et n'ont pas les variantes de shadcn (`neutral`,
`noShadow`, `reverse`). Les installer obligerait à reprendre chaque appel des pages gardées. On
garde donc nos primitives (Radix, variantes `default`, `outline`, `ghost`, `secondary`,
`destructive`, `link`) et on leur applique la grammaire Neobrutalism :

- **Bordure** : `border-2 border-border` sur tout ce qui se touche ou se lit comme un bloc
  (boutons, champs, cartes, menus, dialogues, onglets, badges, cases à cocher, tableaux).
- **Ombre dure** : `shadow-shadow` sur les boutons pleins, les cartes et les surfaces flottantes.
  Au survol, un bouton s'enfonce : `translate` de l'ombre, puis `shadow-none`.
- **Variantes** : `default` est l'aplat orange ; `outline` et `secondary` sont blancs, bordés et
  ombrés ; `ghost` et `link` restent sans bordure ; `destructive` est l'aplat rouge.

**L'action et le record restent distingués par la forme** : l'action est l'aplat orange, le record
un contour orange avec sa flèche montante. L'orange `#FF7A05` ne tient pas en texte sur le crème
(≈ 2:1) : le texte d'un record passe par un orange foncé (`--main-ink`) qui atteint 4,5:1.
**Le danger garde son rouge** et ne porte jamais l'action ni le record (D36). Le repère de superset
(`--superset`) garde sa valeur claire actuelle.

Les tokens de l'ancien vocabulaire (`--canvas`, `--surface-*`, `--ink-*`, `--accent*`, `--cal-*`,
`--float-*`) disparaissent : les pages gardées passent aux rôles shadcn traduits dans
`@theme inline`. Un rôle encore utilisé qui n'aurait plus de valeur n'émet aucune règle et passe
inaperçu : le typecheck ne le voit pas. On le chasse donc par une recherche des anciens noms.

## D194 — Le web est en light seulement

Révise, pour le web, la règle « un token par rôle, deux valeurs par token (sombre / clair) ».

Une seule valeur par token. Disparaissent : le bloc `[data-theme="light"]` (ses valeurs deviennent
`:root`), la variante `dark:` de `globals.css` et les classes `dark:` des primitives,
`lib/theme.ts`, le script de thème de `index.html`, et le choix du thème dans le Profil. Le mobile
garde ses deux registres.

## D195 — Police Space Grotesk

Révise D135. Space Grotesk (500 et 700), en paquet `@fontsource`, remplace Archivo et son axe de
largeur. L'utilitaire `chiffre` garde son nom et son rôle (chiffres héros), mais n'est plus
condensé : gras 700, interligne serré, chiffres tabulaires. `@fontsource-variable/archivo` est
retiré des dépendances.

## D196 — L'auth tient en deux pages minimales

Révise D131, D144 et D158 pour l'auth (marque en tête, formulaire dans une carte).

- **Deux routes** : `/connexion` et `/inscription`. Le formulaire à bascule disparaît : chaque
  page a son formulaire et un lien vers l'autre.
- **Contenu** : un titre (« Connexion », « Créer un compte »), l'e-mail, le mot de passe, le
  bouton, le lien. **Ni logo, ni carte, ni sous-titre, ni pied de page, ni œil pour afficher le
  mot de passe.**
- **Gardé** : les trois refus distincts (identifiants faux ; adresse hors liste blanche, 403 ; API
  injoignable), le retour à la page demandée (`?redirect=`, transmis d'une page à l'autre), les
  états forcés par l'URL (`?etat=`), le contrôle `minLength=8` du mot de passe.
- **Inscription** : réservée à `SIGNUP_ALLOWLIST`, comme avant. Le nom du compte reste l'e-mail.
- Une session ouverte qui arrive sur l'une ou l'autre page est renvoyée vers `/`.

## D197 — L'Accueil est vide

Révise D134 et le tableau de bord (D185–D191 n'ayant jamais atteint `main`, c'est le tableau de
D132–D138 qui part).

`/` garde la coquille commune (barre latérale, en-tête à fil d'Ariane), sans contenu. Le dossier
`features/tableau/` est supprimé avec ses tests. Ce que les pages gardées en tiraient déménage :
`dureeTexte` va dans `features/seances/calculs.ts`, `optionsPreferences` dans
`features/profil/requetes.ts`. Les dépendances et composants que seul le tableau utilisait partent
(Knip les désigne). Les routes `/stats` de l'API ne bougent pas.

Séances, Routines, Exercices et Profil gardent leur logique ; ils changent d'habit par les
primitives (D193) et perdent tout usage des anciens tokens.

## Hors champ

La barre latérale, la mise en page générale et la refonte des pages viendront dans les lots
suivants de `feat/web-refonte`. Le mobile n'est pas touché.

## Vérification

- `/verif` : build, typecheck, test, lint, knip.
- Aucune occurrence des anciens tokens (`--canvas`, `--surface-`, `--ink`, `--accent`, `--cal-`,
  `--float-`, `data-theme`, `dark:`) dans `apps/web/src` ni `apps/web/index.html`.
- Captures Playwright de `/connexion`, `/inscription` (dont `?etat=erreur` et un refus affiché),
  `/` et de chaque page gardée, connecté au compte de contrôle.
