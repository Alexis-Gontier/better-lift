import { creerClient } from "@better-lift/api-client";

/** L'URL de base est la seule chose propre au web : le client, lui, est partagé. */
export const api = creerClient(import.meta.env.VITE_API_URL ?? "http://localhost:3001");
