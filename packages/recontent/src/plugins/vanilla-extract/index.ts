import type { RecontentPlugin } from "@recontentapp/core";
import { outputPlugin } from "../factory.js";
import { generateVanillaExtractFiles, type VanillaExtractPluginOptions } from "./generate.js";

export type { VanillaExtractPluginOptions };

export function vanillaExtract(options: VanillaExtractPluginOptions): RecontentPlugin {
  return outputPlugin(
    "recontent:vanilla-extract",
    ["tokens"],
    options,
    generateVanillaExtractFiles,
  );
}
