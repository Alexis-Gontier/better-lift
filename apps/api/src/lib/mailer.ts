import { type EmailContent } from "./emails.js";
import { env } from "./env.js";

/**
 * Envoi d'e-mails transactionnels (doc 09 D20).
 *
 * L'interface tient en une méthode, et c'est délibéré : le fournisseur est une
 * décision qu'on peut avoir à revoir — notamment sur la résidence des données
 * (D20) — et une surface d'un seul appel rend ce changement mécanique.
 */

/**
 * `idempotencyKey` doit identifier **l'envoi**, pas le destinataire : Resend
 * déduplique sur 24 h, donc une clé du type `reset/<userId>` empêcherait une
 * seconde demande de réinitialisation légitime de partir. On y met le jeton,
 * qui est unique par demande.
 */
export type Email = EmailContent & {
  to: string;
  idempotencyKey: string;
};

/**
 * Interne à ce module : tout le reste de l'API passe par `sendEmailSafely`,
 * qui est la seule façon d'envoyer un e-mail sans risquer de faire échouer la
 * requête appelante.
 */
type Mailer = {
  send: (email: Email) => Promise<void>;
};

/**
 * Transport de développement : rien ne part, le lien est écrit dans le
 * terminal. C'est ce qui permet de dérouler l'inscription et la
 * réinitialisation sans compte Resend ni domaine vérifié.
 */
function createConsoleMailer(): Mailer {
  return {
    send: async (email) => {
      // Le corps texte porte l'URL en clair : c'est lui qu'on veut lire ici,
      // pas le HTML.
      console.warn(
        `\n📧 [mailer:console] → ${email.to}\n   ${email.subject}\n${email.text
          .split("\n")
          .map((line) => `   │ ${line}`)
          .join("\n")}\n`,
      );
    },
  };
}

/**
 * Transport Resend.
 *
 * Deux pièges du SDK, tous deux vérifiés dans les tests :
 *   - il **ne lève pas** d'exception sur erreur d'API, il renvoie
 *     `{ data, error }`. Un `try/catch` seul laisserait passer les échecs en
 *     silence ;
 *   - le client est instancié paresseusement pour que l'API démarre sans le
 *     paquet chargé quand aucune clé n'est configurée.
 */
function createResendMailer(apiKey: string): Mailer {
  let client: Promise<import("resend").Resend> | undefined;

  const getClient = () => {
    client ??= import("resend").then(({ Resend }) => new Resend(apiKey));
    return client;
  };

  return {
    send: async (email) => {
      const resend = await getClient();

      const { data, error } = await resend.emails.send(
        {
          from: env.EMAIL_FROM,
          to: [email.to],
          subject: email.subject,
          html: email.html,
          text: email.text,
        },
        { idempotencyKey: email.idempotencyKey },
      );

      if (error) {
        throw new Error(`Resend a refusé l'envoi (${error.name}) : ${error.message}`);
      }

      console.warn(`📧 [mailer:resend] ${email.subject} → ${email.to} (${data?.id})`);
    },
  };
}

/**
 * Le transport est choisi une fois, au chargement du module. `env` a déjà
 * garanti qu'une clé est présente en production.
 */
const mailer: Mailer = env.RESEND_API_KEY
  ? createResendMailer(env.RESEND_API_KEY)
  : createConsoleMailer();

/**
 * Enveloppe d'envoi **non bloquante**.
 *
 * Aucun des deux e-mails de l'authentification ne doit pouvoir faire échouer la
 * requête qui le déclenche :
 *
 *   - à l'inscription, la vérification est non bloquante par décision (D6) :
 *     un incident chez le fournisseur d'e-mail ne peut pas empêcher de créer un
 *     compte ;
 *   - à la demande de réinitialisation, propager l'erreur ferait répondre 500
 *     pour une adresse connue et 200 pour une inconnue — ce qui transformerait
 *     le formulaire en oracle d'existence de compte.
 *
 * L'échec est donc journalisé, jamais propagé.
 */
export async function sendEmailSafely(email: Email, context: string): Promise<void> {
  try {
    await mailer.send(email);
  } catch (cause) {
    console.error(`[mailer] échec d'envoi (${context}) vers ${email.to}`, cause);
  }
}
