import type { RecontentPlugin } from "../types.js";
import { outputPlugin } from "../factory.js";
import { themeNameDiagnostics } from "../shared/theme-source.js";
import {
  generateVanillaExtractFiles,
  VANILLA_EXTRACT_RESERVED_EXPORTS,
  type VanillaExtractPluginOptions,
} from "./generate.js";

export type { VanillaExtractPluginOptions };

export function vanillaExtract(options: VanillaExtractPluginOptions): RecontentPlugin {
  return outputPlugin(
    "recontent:vanilla-extract",
    ["tokens"],
    options,
    generateVanillaExtractFiles,
    themeNameDiagnostics("vanilla-extract", VANILLA_EXTRACT_RESERVED_EXPORTS),
  );
}
