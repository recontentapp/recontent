import path from "node:path";
import type { PluginContext, PluginDiagnostic, RecontentPlugin } from "./types.js";
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
    generate: (ctx) => {
      const outDir = path.posix.normalize(options.outDir.replaceAll("\\", "/"));
      return generate(ctx, options).map((file) => {
        const filename = file.filename.replaceAll("\\", "/");
        const joined = path.posix.normalize(path.posix.join(outDir, filename));
        const relative = path.posix.relative(outDir, joined);
        if (relative.startsWith("..") || path.posix.isAbsolute(relative)) {
          throw new Error(`Output filename "${file.filename}" escapes outDir "${options.outDir}".`);
        }
        return {
          path: joined,
          content: file.content,
          writeMode: file.writeMode,
        };
      });
    },
  };
}
