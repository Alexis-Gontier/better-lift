/** Minuscules, sans accents : « Développé » → « developpe ». La clé des filtres de liste (D160). */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
