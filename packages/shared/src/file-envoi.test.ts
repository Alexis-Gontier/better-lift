import { describe, expect, it } from "vitest";
import { aEnvoyer, apresReponse, classerReponse, mettreEnFile } from "./file-envoi.js";
import { demarrerVide } from "./seance.js";

const T0 = new Date("2026-09-24T18:00:00.000Z");
const s1 = demarrerVide("s1", T0);
const s2 = demarrerVide("s2", T0);
const FIN = "2026-09-24T19:00:00.000Z";

describe("classerReponse", () => {
  it("201 et 200 : envoyée — 200 est un rejeu déjà enregistré", () => {
    expect(classerReponse(201)).toBe("envoyee");
    expect(classerReponse(200)).toBe("envoyee");
  });

  // Refusée : le serveur l'a lue et n'en veut pas. Renvoyer ne changerait rien.
  it("400, 409 et 422 : refusée", () => {
    expect(classerReponse(400)).toBe("refusee");
    expect(classerReponse(409)).toBe("refusee");
    expect(classerReponse(422)).toBe("refusee");
  });

  // Tout le reste se retente : la séance ne doit JAMAIS être jetée sur un échec
  // qui n'est pas de son fait. 401 compris — une session expirée se renouvelle.
  it("réseau coupé, 401, 429 et 5xx : à réessayer", () => {
    expect(classerReponse(null)).toBe("reessayer");
    expect(classerReponse(401)).toBe("reessayer");
    expect(classerReponse(429)).toBe("reessayer");
    expect(classerReponse(500)).toBe("reessayer");
    expect(classerReponse(503)).toBe("reessayer");
  });
});

describe("la file", () => {
  it("met en file, sans doublon sur l'identifiant", () => {
    let file = mettreEnFile([], s1, FIN);
    file = mettreEnFile(file, s2, FIN);
    file = mettreEnFile(file, s1, FIN);
    expect(file.map((e) => e.seance.id)).toEqual(["s1", "s2"]);
    expect(file[0]).toEqual({ seance: s1, fin: FIN, erreur: null });
  });

  it("une séance envoyée quitte la file", () => {
    const file = mettreEnFile(mettreEnFile([], s1, FIN), s2, FIN);
    expect(apresReponse(file, "s1", { issue: "envoyee" }).map((e) => e.seance.id)).toEqual(["s2"]);
  });

  // D10 : une séance refusée RESTE, avec son message — elle n'est ni perdue ni
  // renvoyée en boucle.
  it("une séance refusée reste, avec son message, et n'est plus à envoyer", () => {
    const file = apresReponse(mettreEnFile([], s1, FIN), "s1", {
      issue: "refusee",
      message: "Exercice inconnu",
    });
    expect(file[0]?.erreur).toBe("Exercice inconnu");
    expect(aEnvoyer(file)).toEqual([]);
  });

  it("une séance à réessayer reste telle quelle", () => {
    const file = mettreEnFile([], s1, FIN);
    expect(apresReponse(file, "s1", { issue: "reessayer" })).toEqual(file);
    expect(aEnvoyer(file).map((e) => e.seance.id)).toEqual(["s1"]);
  });

  it("remettre en file efface une erreur passée", () => {
    const refusee = apresReponse(mettreEnFile([], s1, FIN), "s1", {
      issue: "refusee",
      message: "x",
    });
    expect(mettreEnFile(refusee, s1, FIN)[0]?.erreur).toBeNull();
  });
});
