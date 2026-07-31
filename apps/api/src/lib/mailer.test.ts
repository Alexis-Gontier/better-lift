import { afterEach, describe, expect, it, vi } from "vitest";

import { sendEmailSafely } from "./mailer.js";

const email = {
  to: "alex@better-lift.local",
  subject: "Objet",
  html: "<p>corps</p>",
  text: "corps",
  idempotencyKey: "verify-email/jeton",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendEmailSafely", () => {
  it("should not propagate the failure when the transport throws", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    // Sans `RESEND_API_KEY`, le transport sélectionné est celui de la console :
    // le faire échouer suffit à simuler une panne d'envoi.
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("transport indisponible");
    });

    /**
     * C'est tout l'objet de cette enveloppe : un incident d'envoi ne doit
     * jamais faire échouer l'inscription (D6), ni transformer la demande de
     * réinitialisation en oracle d'existence de compte — un 500 pour une
     * adresse connue face à un 200 pour une inconnue serait exactement ça.
     */
    await expect(sendEmailSafely(email, "verify-email")).resolves.toBeUndefined();
    expect(errorLog).toHaveBeenCalled();
  });

  it("should send through the console transport when no API key is configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendEmailSafely(email, "verify-email");

    // Le corps texte porte l'URL en clair : c'est ce qui rend le parcours
    // déroulable en local sans compte Resend ni domaine vérifié.
    expect(warn.mock.calls[0]?.[0]).toContain("corps");
  });
});
