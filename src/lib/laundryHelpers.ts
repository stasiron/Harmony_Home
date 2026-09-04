import type { LaundryProgram } from "@/types";

export type LaundryAddInput = {
  name: string;
  mode: string;
  temperature: number;
  rinses: number;
  spin: number;
};

export function buildLaundryProgram(
  input: LaundryAddInput,
): LaundryProgram | null {
  const name = input.name.trim();
  const mode = input.mode.trim();
  if (!name || !mode) return null;
  if (
    !Number.isFinite(input.temperature) ||
    !Number.isFinite(input.rinses) ||
    !Number.isFinite(input.spin)
  ) {
    return null;
  }
  if (input.rinses < 0 || input.spin < 0 || input.temperature < 0) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    name,
    mode,
    temperature: Math.round(input.temperature),
    rinses: Math.round(input.rinses),
    spin: Math.round(input.spin),
    createdAt: new Date().toISOString(),
  };
}
