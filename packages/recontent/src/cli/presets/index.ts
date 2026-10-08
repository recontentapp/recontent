import { material } from "./material.js";
import { shadcnNeutral } from "./shadcn-neutral.js";

export type InitPreset = {
  name: string;
  description: string;
  /** Full contents of the generated `recontent.config.ts`. */
  source: string;
};

export const PRESETS: readonly InitPreset[] = [shadcnNeutral, material];

export const PRESET_NAMES: string[] = PRESETS.map((preset) => preset.name);

export function findPreset(name: string): InitPreset | undefined {
  return PRESETS.find((preset) => preset.name === name);
}
