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
  /**
   * Accent color of the page: links, the active sidebar entry, focus rings and selections.
   * Any CSS color, e.g. `#e5484d`. Applies to both light and dark mode, so pick one that reads on both.
   * Defaults to a blue.
   */
  color?: string;
};

export function generateDocsFiles(ctx: PluginContext, options: DocsPluginOptions): OutputFile[] {
  const model = buildDocsModel(ctx, options.title ?? "Design system");
  return [{ filename: "design.html", content: renderHtml(model, ctx, options) }];
}

export function docs(options: DocsPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:docs", ["tokens", "introspection?"], options, generateDocsFiles);
}
