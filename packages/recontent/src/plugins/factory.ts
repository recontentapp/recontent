import path from "node:path";
import type { OutputFile, PluginContext, RecontentPlugin } from "@recontentapp/core";

/**
 * Builds a `RecontentPlugin` around a generator that produces `OutputFile[]`
 * relative to `options.outDir` — the shape shared by every output target's
 * plugin (css, stylex, typescript, typescript-native, vanilla-extract).
 */
export function outputPlugin<Options extends { outDir: string }>(
  name: string,
  options: Options,
  generate: (ctx: PluginContext, options: Options) => OutputFile[],
  dependencies?: (ctx: PluginContext) => Record<string, string>,
): RecontentPlugin {
  return {
    name,
    ...(dependencies ? { dependencies } : {}),
    generate: (ctx) =>
      generate(ctx, options).map((file) => ({
        path: path.posix.join(options.outDir, file.filename),
        content: file.content,
        writeMode: file.writeMode,
      })),
  };
}
