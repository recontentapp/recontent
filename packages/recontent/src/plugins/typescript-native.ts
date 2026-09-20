import type { RecontentPlugin } from "@recontentapp/core";
import {
  generateTypeScriptNativeFiles,
  type TypeScriptNativePluginOptions,
} from "../outputs/typescript-native.js";
import { outputPlugin } from "./factory.js";

export type { TypeScriptNativePluginOptions };

export function typescriptNative(options: TypeScriptNativePluginOptions): RecontentPlugin {
  return outputPlugin("recontent:typescript-native", options, generateTypeScriptNativeFiles);
}
