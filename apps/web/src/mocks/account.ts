/** Le compte connecté, en attendant la session de l'API. */
export const mockAccount = {
  name: "Alexis Gontier",
  email: "alexis@example.com",
};

/** Les initiales d'un nom : « Alexis Gontier » → « AG ». */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
