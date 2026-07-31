---
description: Vérifie que le socle documentaire et la configuration Claude Code de better-lift sont complets et cohérents avant de démarrer la V0. Contrôle la présence, l'intégrité du contenu et l'hygiène du dépôt.
disable-model-invocation: true
argument-hint: (aucun argument) | --fix pour proposer les correctifs
---

# Contrôle pré-V0

Tu vérifies que le socle de better-lift est complet **avant** que la moindre ligne de code applicatif soit écrite. Rien à construire ici : tu inventories, tu compares, tu rapportes.

## Inventaire

Arborescence du dépôt, hors dépendances :

!`find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './.next/*' -not -path './dist/*' | sort`

État git :

!`git status --short 2>/dev/null || echo "PAS DE DÉPÔT GIT"`

Fichiers suivis par git contenant des secrets potentiels :

!`git ls-files 2>/dev/null | grep -E '(^|/)\.env($|\.)|settings\.local\.json|generated/prisma' || echo "aucun"`

Contenu du .gitignore :

!`cat .gitignore 2>/dev/null || echo "ABSENT"`

## Méthode

Lis `checklist.md` dans ce répertoire de skill : il contient la liste attendue, les marqueurs de contenu à vérifier et les anti-patterns.

Pour chaque entrée, statue en trois niveaux :

- **OK** — présent et conforme
- **INCOMPLET** — présent mais le contenu ne remplit pas son rôle (fichier vide, marqueur de contenu absent, JSON invalide, CLAUDE.md au-delà de 200 lignes)
- **MANQUANT** — absent

Un fichier qui existe mais ne contient rien d'utile compte comme INCOMPLET, pas comme OK. Ouvre réellement les fichiers pour vérifier les marqueurs, ne te contente pas de `find`.

## Rapport attendu

Produis dans cet ordre :

1. **Un tableau de synthèse** par section (Documentation, Configuration Claude Code, Hygiène du dépôt), avec le compte OK / INCOMPLET / MANQUANT.
2. **Le détail des écarts uniquement.** Ne liste pas les fichiers conformes un par un — une ligne de synthèse par section suffit. Pour chaque écart : le fichier, le niveau, ce qui manque précisément.
3. **Les anti-patterns détectés**, séparément. Ce sont les plus graves : un `.env` suivi par git n'est pas un fichier manquant, c'est une fuite.
4. **Un verdict en une ligne** : le dépôt est-il prêt à démarrer la V0, oui ou non.

Si `$ARGUMENTS` contient `--fix`, propose ensuite les correctifs concrets, ordonnés du plus grave au plus bénin. **Ne les applique pas sans validation explicite.** Un correctif qui touche `.gitignore` ou l'historique git doit être signalé comme nécessitant une action manuelle.

## Ce que tu ne fais pas

- Tu ne crées aucun fichier de code applicatif : la V0 n'a pas commencé.
- Tu ne réécris pas les docs existantes, même si tu les trouves perfectibles. Signale, ne corrige pas.
- Tu ne juges pas les décisions consignées dans `docs/09-decisions.md`. Elles sont tranchées ; ton rôle est de vérifier qu'elles sont écrites, pas d'en rediscuter.
