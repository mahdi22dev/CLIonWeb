import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripAnsi(str: string): string {
  return (
    str
      // Remove OSC (Operating System Command) sequences (e.g., window title changes)
      .replace(/\x1B\]\d+;[^\x07]*\x07/g, "")
      // Remove CSI (Control Sequence Introducer) sequences (colors, cursor moves)
      .replace(/\x1B\[[\d;]*[A-Za-z]/g, "")
      // Remove private mode sequences (e.g., `?2004h`)
      .replace(/\x1B\[\?[\d;]*[hl]/g, "")
      // Remove any remaining escape sequences
      .replace(/\x1B./g, "")
      // Trim weird whitespace/control chars
      .trim()
  );
}

export const extractPromptPrefix = (prompt: string) => {
  return prompt.split(":")[0];
};
