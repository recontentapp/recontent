import type { RecontentPlugin } from "@recontentapp/core";
import { generateStylexFiles, type StylexPluginOptions } from "../outputs/stylex.js";
import { outputPlugin } from "./factory.js";

export type { StylexPluginOptions };

export function stylex(options: StylexPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:stylex", options, generateStylexFiles, () => ({
    "@stylexjs/stylex": "^0.19.0",
  }));
}
