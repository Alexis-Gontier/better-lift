---
paths:
  - "apps/web/**"
  - "packages/ui/**"
---

# Web — Next.js 16

- App Router, **Turbopack par défaut** : ne pas produire de configuration webpack.
- La protection des routes passe par **`proxy.ts`**, pas `middleware.ts` : en Next 16 le fichier est renommé et l'export nommé s'appelle `proxy`. Le build échoue si les deux fichiers coexistent. `proxy` tourne en runtime Node, jamais en edge.
- Server Components par défaut. `"use client"` réservé à l'interactif : éditeur de routines, formulaires, graphiques, recherche instantanée.
- **Jamais d'import Prisma ici**, même dans un Server Component. Tout passe par `packages/api-client`.
- Tailwind **4** (config CSS-first) + shadcn/ui. Un composant réutilisé deux fois part dans `packages/ui`.
- TanStack Query 5 pour l'état serveur côté client. `dnd-kit` pour le glisser-déposer, Recharts pour les graphiques.

## Affichage

- Les charges passent par `<Weight value={kg} />`, qui lit la préférence d'unité depuis le contexte. **Aucun composant n'appelle une conversion à la main.**
- `Intl.NumberFormat` / `Intl.DateTimeFormat` avec la locale du **profil**, pas celle du navigateur.
- Thème sombre par défaut (usage en salle), clair disponible.

## Qualité obligatoire

Chaque écran traite les états **chargement / erreur / vide**. L'état vide du dashboard n'est pas une variante décorative : c'est le premier écran que voit un inscrit, il doit guider vers « créer une routine ».

Accessibilité WCAG 2.1 AA : alternative clavier au glisser-déposer (`dnd-kit` la fournit, il faut la câbler), graphiques accompagnés d'un équivalent textuel.

Libellés en fr **et** en en.

Détail des écrans : `docs/05-app-web.md`.
