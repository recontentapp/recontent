import path from "node:path";
import type { RecontentPlugin } from "@recontentapp/core";
import { generateVanillaExtractFiles, type VanillaExtractPluginOptions } from "./generate.js";
import { getBuiltInComponentDependencies, normalizeBuiltInComponents } from "./registry/index.js";

export type { VanillaExtractPluginOptions };
export type { BuiltInComponentOptions, RegistryComponentName } from "./registry/manifest.js";

export function vanillaExtract(options: VanillaExtractPluginOptions): RecontentPlugin {
  return {
    name: "recontent:vanilla-extract",
    dependencies: () => {
      const selection = normalizeBuiltInComponents(options.builtInComponents);
      if (selection.names.length === 0) return {};
      return getBuiltInComponentDependencies(selection.names);
    },
    generate: (ctx) =>
      generateVanillaExtractFiles(ctx, options).map((file) => ({
        path: path.posix.join(options.outDir, file.filename),
        content: file.content,
        writeMode: file.writeMode,
      })),
  };
}
