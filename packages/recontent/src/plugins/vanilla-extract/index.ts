import type { RecontentPlugin } from "@recontentapp/core";
import { outputPlugin } from "../factory.js";
import { generateVanillaExtractFiles, type VanillaExtractPluginOptions } from "./generate.js";
import {
  getBuiltInComponentDependencies,
  normalizeBuiltInComponents,
  resolveBuiltInComponentIds,
} from "./registry/index.js";

export type { VanillaExtractPluginOptions };
export type { BuiltInComponentOptions, RegistryComponentName } from "./registry/manifest.js";

export function vanillaExtract(options: VanillaExtractPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:vanilla-extract", options, generateVanillaExtractFiles, () => {
    const selection = normalizeBuiltInComponents(options.builtInComponents);
    if (selection.names.length === 0) return {};
    return getBuiltInComponentDependencies(resolveBuiltInComponentIds(selection.names));
  });
}
