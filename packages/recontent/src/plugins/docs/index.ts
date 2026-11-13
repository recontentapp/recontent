import type { PluginContext, RecontentPlugin } from "@recontentapp/core";
import type { OutputFile } from "../shared/context.js";
import { outputPlugin } from "../factory.js";
import { buildDocsModel } from "./model.js";
import { renderHtml } from "./html.js";

export type DocsPluginOptions = {
  outDir: string;
  /** Page title. Defaults to "Design system". */
  title?: string;
  /**
   * Where the repository's files are browsable, e.g. `https://github.com/acme/ui/blob/main`.
   * A component's source location then links to `<gitBaseUrl>/<path>#L<line>`, the path being
   * relative to the config file: include the config's own folder if it isn't the repository root.
   */
  gitBaseUrl?: string;
};

export function generateDocsFiles(ctx: PluginContext, options: DocsPluginOptions): OutputFile[] {
  const model = buildDocsModel(ctx, options.title ?? "Design system");
  return [{ filename: "design.html", content: renderHtml(model, ctx, options.gitBaseUrl) }];
}

export function docs(options: DocsPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:docs", ["tokens", "introspection?"], options, generateDocsFiles);
}
