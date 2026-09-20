import type { RecontentPlugin } from "@recontentapp/core";
import { generateTypeScriptFiles, type TypeScriptPluginOptions } from "../outputs/typescript.js";
import { outputPlugin } from "./factory.js";

export type { TypeScriptPluginOptions };

export function typescript(options: TypeScriptPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:typescript", options, generateTypeScriptFiles);
}
