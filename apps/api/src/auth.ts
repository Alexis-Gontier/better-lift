import "./env.js";

import { expo } from "@better-auth/expo";
import { prisma } from "@better-lift/db";
import { estAutorisee, normaliserListe } from "@better-lift/shared";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";

// Lue UNE FOIS au démarrage. Une liste vide fait échouer le démarrage : une
// liste blanche qui laisse tout passer a l'apparence d'une protection sans en
// être une, et le seul comportement sûr est d'échouer bruyamment.
const LISTE_BLANCHE = normaliserListe(process.env.SIGNUP_ALLOWLIST);

if (LISTE_BLANCHE.length === 0) {
  throw new Error(
    "SIGNUP_ALLOWLIST est absente ou vide. L'inscription serait ouverte à tous : refus de démarrer.",
  );
}

const MESSAGE_REFUS = "Cette adresse n'est pas autorisée à créer un compte.";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  // Le plugin serveur du mobile : il fait accepter le schéma de l'application
  // comme origine, et sert le jeton porteur là où le web reçoit un cookie.
  plugins: [expo()],

  // La limitation des tentatives vit EN BASE : sur Vercel, chaque instance de la
  // fonction a sa propre mémoire, et le stockage par défaut (mémoire) ne
  // limitait donc rien. Active en production seulement (défaut de Better Auth).
  // L'IP vient de `x-forwarded-for`, que Vercel réécrit en une seule valeur.
  rateLimit: {
    storage: "database",
    // Plus strict que le défaut (3 par 10 s) : 5 essais de mot de passe par
    // minute et par IP. Les 2–3 comptes n'en ont jamais besoin de plus.
    customRules: { "/sign-in/email": { window: 60, max: 5 } },
  },

  trustedOrigins: [
    "http://localhost:3000",
    "better-lift://",
    // Le schéma `exp://` d'Expo Go n'est de confiance QU'en développement.
    ...(process.env.NODE_ENV !== "production" ? ["exp://", "exp://**"] : []),
  ],

  // LE garde (D30). Lié à la création d'un utilisateur, donc valable pour tout
  // chemin présent ou futur — y compris un fournisseur OAuth ajouté plus tard,
  // que le hook de route ci-dessous ne couvrirait pas.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!estAutorisee(user.email, LISTE_BLANCHE)) {
            throw new APIError("FORBIDDEN", { message: MESSAGE_REFUS });
          }
        },
      },
    },
  },

  // Confort, pas sécurité : il rend au formulaire un message lisible plutôt que
  // l'erreur remontée depuis la couche base. Ne jamais s'y fier seul — si les
  // deux devaient un jour diverger, c'est celui-ci qu'on supprime.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email = ctx.body?.email;
      if (typeof email === "string" && !estAutorisee(email, LISTE_BLANCHE)) {
        throw new APIError("FORBIDDEN", { message: MESSAGE_REFUS });
      }
    }),
  },
});
