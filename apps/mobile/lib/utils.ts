import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind (registre React Native Reusables). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
