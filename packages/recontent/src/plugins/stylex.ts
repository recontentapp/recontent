import path from "node:path";
import type { RecontentPlugin } from "@recontentapp/core";
import { generateStylexFiles, type StylexPluginOptions } from "../outputs/stylex.js";

export type { StylexPluginOptions };

export function stylex(options: StylexPluginOptions): RecontentPlugin {
  return {
    name: "recontent:stylex",
    dependencies: () => ({ "@stylexjs/stylex": "^0.19.0" }),
    generate: (ctx) =>
      generateStylexFiles(ctx, options).map((file) => ({
        path: path.posix.join(options.outDir, file.filename),
        content: file.content,
        writeMode: file.writeMode,
      })),
  };
}
