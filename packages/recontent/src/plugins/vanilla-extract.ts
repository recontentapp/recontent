import path from "node:path";
import type { BuiltInComponentsInput, RecontentPlugin } from "@recontentapp/core";
import {
  generateVanillaExtractFiles,
  type VanillaExtractPluginOptions,
} from "../outputs/vanilla-extract.js";
import { getBuiltInComponentDependencies, normalizeBuiltInComponents } from "../registry/index.js";

export type { VanillaExtractPluginOptions };

export function vanillaExtract(options: VanillaExtractPluginOptions): RecontentPlugin {
  return {
    name: "recontent:vanilla-extract",
    dependencies: () => {
      const selection = normalizeBuiltInComponents(
        options.builtInComponents as BuiltInComponentsInput | undefined,
      );
      if (selection.names.length === 0) return {};
      return getBuiltInComponentDependencies(selection.names, "vanilla-extract");
    },
    generate: (ctx) =>
      generateVanillaExtractFiles(ctx, options).map((file) => ({
        path: path.posix.join(options.outDir, file.filename),
        content: file.content,
        writeMode: file.writeMode,
      })),
  };
}
