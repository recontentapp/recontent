import type { OutputFile, PluginContext, RecontentPlugin } from "@recontentapp/core";
import { outputPlugin } from "../factory.js";
import { renderHtml } from "./html.js";
import { renderMarkdown } from "./markdown.js";
import { buildDocsModel } from "./model.js";

export type DocsPluginOptions = {
  outDir: string;
  /** Write `design.html`. Defaults to `true`. */
  html?: boolean;
  /** Write `design.md`. Defaults to `false`. */
  markdown?: boolean;
  /** Page / document title. Defaults to "Design tokens". */
  title?: string;
};

export function generateDocsFiles(ctx: PluginContext, options: DocsPluginOptions): OutputFile[] {
  const html = options.html ?? true;
  const markdown = options.markdown ?? false;
  if (!html && !markdown) {
    throw new Error("docs() needs at least one of `html` or `markdown` enabled.");
  }

  const model = buildDocsModel(ctx, options.title ?? "Design tokens");
  return [
    ...(html ? [{ filename: "design.html", content: renderHtml(model, ctx) }] : []),
    ...(markdown ? [{ filename: "design.md", content: renderMarkdown(model) }] : []),
  ];
}

export function docs(options: DocsPluginOptions): RecontentPlugin {
  if (!(options.html ?? true) && !(options.markdown ?? false)) {
    throw new Error("docs() needs at least one of `html` or `markdown` enabled.");
  }
  return outputPlugin("recontent:docs", ["tokens", "components"], options, generateDocsFiles);
}
