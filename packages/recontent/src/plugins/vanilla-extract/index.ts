import type { RecontentPlugin } from "@recontentapp/core";
import { outputPlugin } from "../factory.js";
import { generateVanillaExtractFiles, type VanillaExtractPluginOptions } from "./generate.js";

export type { VanillaExtractPluginOptions };
export type { BuiltInComponentOptions, RegistryComponentName } from "./registry/manifest.js";

export function vanillaExtract(options: VanillaExtractPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:vanilla-extract", options, generateVanillaExtractFiles);
}
