/** Sans casse ni accents : « Développé » se trouve en tapant « developpe ». */
export const fold = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
