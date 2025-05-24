import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripAnsi(str: string): string {
  return str
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "") // ESC [ ... commands
    .replace(/\x1B\][^\x07]*\x07/g, "") // ESC ] ... BEL (title)
    .replace(/\x1B[?][0-9]+[hl]/g, ""); // ESC ?2004h or similar
}
