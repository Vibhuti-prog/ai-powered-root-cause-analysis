import type { ClassValue } from "./types-only";
import { clsx } from "./clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
