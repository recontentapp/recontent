import type { RecontentPlugin } from "@recontentapp/core";
import { generateCssFiles, type CssPluginOptions } from "../outputs/css.js";
import { outputPlugin } from "./factory.js";

export type { CssPluginOptions };

export function css(options: CssPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:css", options, generateCssFiles);
}
