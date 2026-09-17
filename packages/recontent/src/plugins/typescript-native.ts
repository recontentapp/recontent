import path from "node:path";
import type { RecontentPlugin } from "@recontentapp/core";
import {
  generateTypeScriptNativeFiles,
  type TypeScriptNativePluginOptions,
} from "../outputs/typescript-native.js";

export type { TypeScriptNativePluginOptions };

export function typescriptNative(options: TypeScriptNativePluginOptions): RecontentPlugin {
  return {
    name: "recontent:typescript-native",
    generate: (ctx) =>
      generateTypeScriptNativeFiles(ctx, options).map((file) => ({
        path: path.posix.join(options.outDir, file.filename),
        content: file.content,
        writeMode: file.writeMode,
      })),
  };
}
