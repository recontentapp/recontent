import { material } from "./material.js";
import { neutral } from "./neutral.js";

export type InitPreset = {
  name: string;
  description: string;
  source: string;
};

export const PRESETS: readonly InitPreset[] = [neutral, material];

export const PRESET_NAMES: string[] = PRESETS.map((preset) => preset.name);

export function getPreset(name: string): InitPreset {
  const preset = PRESETS.find((candidate) => candidate.name === name);
  if (!preset) {
    throw new Error(`Unknown preset "${name}". Available presets: ${PRESET_NAMES.join(", ")}.`);
  }
  return preset;
}
