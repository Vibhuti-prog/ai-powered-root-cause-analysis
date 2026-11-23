import type { ClassValue } from "./types-only";

export function clsx(inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
