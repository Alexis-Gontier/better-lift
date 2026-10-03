/**
 * La normalisation de recherche, en un seul endroit.
 *
 * Elle sert DEUX FOIS et doit donc être unique : le semis la passe sur les noms
 * pour remplir `Exercise.nomRecherche`, et l'API la passe sur la saisie
 * avant de comparer. Deux implémentations qui divergeraient d'une casse ou d'un
 * accent rendraient la colonne inutile — la requête ne trouverait rien, sans la
 * moindre erreur pour le signaler.
 *
 * `NFD` sépare la lettre de son diacritique, `\p{Diacritic}` retire le second :
 * « é » devient « e », « ç » devient « c ». Tout ce qui n'est ni lettre ASCII ni
 * chiffre devient un espace — les symboles ne collent donc jamais deux mots
 * ensemble, et « 3/4 sit-up » se cherche en tapant « 3 4 sit up » comme en
 * tapant « sit up ».
 */
export function normaliserRecherche(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Le contenu de `Exercise.nomRecherche` : le nom français PUIS le nom anglais,
 * normalisés ensemble (D44). « developpe couche » et « bench press » trouvent
 * donc le même exercice. Le français vient en tête pour que trier sur cette
 * colonne revienne à trier sur le nom affiché.
 */
export function texteRecherche(nomFr: string, nomAnglais: string): string {
  return normaliserRecherche(`${nomFr} ${nomAnglais}`);
}

/**
 * Le slug d'un exercice : son identifiant dans l'URL.
 *
 * Il est tiré du nom ANGLAIS, qui ne bouge jamais : corriger un nom français ne
 * doit pas casser une URL, ni faire créer une ligne de plus au semis, qui
 * `upsert` sur le slug. Il dérive de `normaliserRecherche` plutôt que d'avoir sa
 * propre normalisation, et le détourage fait le reste : aucun tiret en tête, en
 * queue, ni en double.
 */
export function slugifier(nom: string): string {
  return normaliserRecherche(nom).replace(/ /g, "-");
}

/**
 * Le catalogue filtré SUR LE TÉLÉPHONE (D97), hors ligne compris. Même
 * normalisation que l'API, même sémantique (« contient ») : une saisie trouve
 * en ligne et hors ligne exactement les mêmes exercices. L'ordre reçu est gardé
 * — l'API trie déjà sur `nomRecherche`, donc sur le nom français.
 */
export function filtrerCatalogue<T extends { recherche: string }>(
  liste: readonly T[],
  saisie: string,
): T[] {
  const q = normaliserRecherche(saisie);
  return q === "" ? [...liste] : liste.filter((e) => e.recherche.includes(q));
}
