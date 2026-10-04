import type { RecontentPlugin } from "@recontentapp/core";
import { generateDtcgFiles, type DtcgPluginOptions } from "../outputs/dtcg.js";
import { outputPlugin } from "./factory.js";

export type { DtcgPluginOptions };

export function dtcg(options: DtcgPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:dtcg", options, generateDtcgFiles);
}
