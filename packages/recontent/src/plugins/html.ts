import type { RecontentPlugin } from "@recontentapp/core";
import { generateHtmlFiles, type HtmlPluginOptions } from "../outputs/html.js";
import { outputPlugin } from "./factory.js";

export type { HtmlPluginOptions };

export function html(options: HtmlPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:html", options, generateHtmlFiles);
}
