/** Minuscules, sans accents : « Développé » → « developpe ». La clé des filtres de liste (D160). */
export const plier = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
