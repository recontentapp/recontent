import type { ComponentSourceGenerator } from "../types.js";
import { generateStackSources } from "./stack/index.js";

export const componentSourceGenerators: Record<string, ComponentSourceGenerator> = {
  stack: ({ scales, tokens }) =>
    generateStackSources({ gapScale: scales.gapScale!, backgroundColor: tokens.backgroundColor! }),
};
