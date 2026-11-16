import type { PluginContext, RecontentPlugin } from "../types.js";
import type { OutputFile } from "../shared/context.js";
import { outputPlugin } from "../factory.js";
import { buildDocsModel } from "./model.js";
import { renderHtml } from "./html.js";
import { loadStories, type StorybookOptions } from "./storybook.js";

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
  /**
   * Embeds the stories of each component's `@stories` files, from a Storybook build.
   * Storybook must be built before the docs: its `index.json` tells which stories there are.
   */
  storybook?: StorybookOptions;
};

export function generateDocsFiles(ctx: PluginContext, options: DocsPluginOptions): OutputFile[] {
  const model = buildDocsModel(ctx, options.title ?? "Design system");
  const stories = loadStories(ctx, options.storybook);
  const storybookUrl = options.storybook?.url;
  return [
    {
      filename: "design.html",
      content: renderHtml(model, ctx, { ...options, stories, storybookUrl }),
    },
  ];
}

export function docs(options: DocsPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:docs", ["tokens", "introspection?"], options, generateDocsFiles);
}
