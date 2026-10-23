import { enregistrerNotificationRepos } from "./lib/notification-repos";

// Avant l'app : un bouton de la notification touché app tuée relance ce code
// seul, sans écran, et doit trouver son traitement déjà enregistré (D338).
enregistrerNotificationRepos();

import "expo-router/entry";
