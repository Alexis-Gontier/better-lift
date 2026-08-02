import { Stack } from "expo-router";

import { ActiveWorkout } from "@/features/workouts/active-workout";

export default function ActiveWorkoutScreen() {
  return (
    <>
      {/*
        Plein écran, sans en-tête de navigation : la séance porte le sien, avec
        son chrono et sa sortie. `gestureEnabled: false` empêche de quitter
        d'un balayage — `✕` propose explicitement de reprendre plus tard ou
        d'abandonner (doc 06), et un geste de retour contournerait ce choix.
      */}
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <ActiveWorkout />
    </>
  );
}
