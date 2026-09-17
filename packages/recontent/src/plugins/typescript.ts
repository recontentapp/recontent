import path from "node:path";
import type { RecontentPlugin } from "@recontentapp/core";
import { generateTypeScriptFiles, type TypeScriptPluginOptions } from "../outputs/typescript.js";

export type { TypeScriptPluginOptions };

export function typescript(options: TypeScriptPluginOptions): RecontentPlugin {
  return {
    name: "recontent:typescript",
    generate: (ctx) =>
      generateTypeScriptFiles(ctx, options).map((file) => ({
        path: path.posix.join(options.outDir, file.filename),
        content: file.content,
        writeMode: file.writeMode,
      })),
  };
}
