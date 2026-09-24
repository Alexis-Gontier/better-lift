import { creerClient } from "@better-lift/api-client";
import { URL_API } from "./config";

/** L'URL de base est la seule chose propre au web : le client, lui, est partagé. */
export const api = creerClient(URL_API);
