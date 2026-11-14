import path from "node:path";
import type { PluginContext, PluginDiagnostic, RecontentPlugin } from "@recontentapp/core";
import type { OutputFile } from "./shared/context.js";

/**
 * Builds a `RecontentPlugin` around a generator that produces `OutputFile[]`
 * relative to `options.outDir` — the shape shared by every output target's
 * plugin (css, stylex, typescript, typescript-native, vanilla-extract, docs, design-md).
 */
export function outputPlugin<Options extends { outDir: string }>(
  name: string,
  dependsOn: RecontentPlugin["dependsOn"],
  options: Options,
  generate: (ctx: PluginContext, options: Options) => OutputFile[],
  validate?: (ctx: PluginContext) => PluginDiagnostic[],
): RecontentPlugin {
  return {
    name,
    dependsOn,
    ...(validate ? { validate } : {}),
    generate: (ctx) =>
      generate(ctx, options).map((file) => ({
        path: path.posix.join(options.outDir.replaceAll("\\", "/"), file.filename),
        content: file.content,
        writeMode: file.writeMode,
      })),
  };
}
