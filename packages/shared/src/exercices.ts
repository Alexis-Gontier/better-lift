import { z } from "zod";
import type { Groupe } from "./vocabulaire.js";
import { GROUPES } from "./vocabulaire.js";

/**
 * Le contrat du catalogue, côté entrée.
 *
 * Seule la requête est décrite ici : la forme de la réponse est INFÉRÉE par Hono
 * RPC depuis le gestionnaire. La décrire aussi en Zod donnerait deux
 * descriptions à tenir d'accord, et elles divergeraient.
 *
 * `z.coerce` est indispensable : les paramètres d'URL arrivent toujours en
 * chaînes, et `page=2` échouerait au parse sans lui.
 */
export const requeteCatalogue = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  groupe: z.enum(GROUPES).optional(),
  equipement: z.string().trim().min(1).max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Plafonnée : sans borne, une requête ferait remonter tout le catalogue.
  taille: z.coerce.number().int().min(1).max(100).default(50),
});

export type RequeteCatalogue = z.infer<typeof requeteCatalogue>;

/** Ce qu'une ligne de liste montre — et rien de plus. */
export type ExerciceResume = {
  slug: string;
  /** Le nom français, affiché (D44). */
  nom: string;
  /** La clé de données, pas le libellé : le français vient de `LIBELLE_GROUPE`. */
  groupe: Groupe;
  equipement: string;
  /**
   * URL de l'image fixe (JPG, ~6 Ko), ou `null` : c'est elle que montrent les
   * listes — des centaines de GIF animés à la fois pèseraient trop.
   */
  image: string | null;
};

export type ExerciceDetail = ExerciceResume & {
  /** URL de l'animation, ou `null` : l'interface a toujours un repli sans visuel. */
  gif: string | null;
  /**
   * Le nom d'origine, affiché en sous-titre : il explique pourquoi « bench » a
   * trouvé « Développé couché », et reste la référence si un nom français est
   * maladroit (D44).
   */
  nomAnglais: string;
  cible: string;
  secondaires: string[];
  instructions: string[];
};

/**
 * La mention que chaque animation doit porter (D46). Elle vit ici, et non dans
 * un composant, pour que le web et le mobile affichent exactement la même.
 */
export const ATTRIBUTION_MEDIAS = "© Gym visual — https://gymvisual.com/";
