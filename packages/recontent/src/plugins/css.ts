import path from "node:path";
import type { RecontentPlugin } from "@recontentapp/core";
import { generateCssFiles, type CssPluginOptions } from "../outputs/css.js";

export type { CssPluginOptions };

export function css(options: CssPluginOptions): RecontentPlugin {
  return {
    name: "recontent:css",
    generate: (ctx) =>
      generateCssFiles(ctx, options).map((file) => ({
        path: path.posix.join(options.outDir, file.filename),
        content: file.content,
        writeMode: file.writeMode,
      })),
  };
}
