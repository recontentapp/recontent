import { material } from "./material.js";
import { neutral } from "./neutral.js";

export type InitPreset = {
  name: string;
  description: string;
  source: string;
};

export const PRESETS: readonly InitPreset[] = [neutral, material];

export const PRESET_NAMES: string[] = PRESETS.map((preset) => preset.name);

export function findPreset(name: string): InitPreset | undefined {
  return PRESETS.find((preset) => preset.name === name);
}
