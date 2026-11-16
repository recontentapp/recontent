import fs from "node:fs";
import path from "node:path";
import type { PluginContext } from "../types.js";

export type StorybookOptions = {
  /**
   * Storybook's build output (`storybook build`), relative to the config file. Its `index.json` is read to
   * find the stories of each component's `@stories` files, so Storybook must be built before the docs.
   */
  outDir: string;
  /** Where that build is served, e.g. `https://ds.acme.com/storybook`. Stories are embedded from there. */
  url: string;
  /** The directory Storybook runs from, relative to the config file, which its `importPath`s are relative to. Defaults to the config's. */
  root?: string;
};

export type Story = { id: string; name: string };

type IndexEntry = { type?: string; id?: string; name?: string; importPath?: string };

const posix = (file: string) => file.split(path.sep).join("/");

function readIndex(ctx: PluginContext, file: string): IndexEntry[] | undefined {
  try {
    const { entries } = JSON.parse(fs.readFileSync(file, "utf8")) as { entries?: unknown };
    if (entries && typeof entries === "object") return Object.values(entries);
  } catch {
    // Reported below.
  }
  ctx.logger.warn(
    `docs: ${posix(path.relative(ctx.root, file))} is missing or not a Storybook index, components are documented without stories. Build Storybook first.`,
  );
  return undefined;
}

/** The stories of each component, by component name, in the order of Storybook's index. */
export function loadStories(
  ctx: PluginContext,
  storybook: StorybookOptions | undefined,
): Map<string, Story[]> {
  const stories = new Map<string, Story[]>();
  const components = ctx.components?.filter((component) => component.stories?.length);
  if (!storybook || !components?.length) return stories;

  const entries = readIndex(ctx, path.resolve(ctx.root, storybook.outDir, "index.json"));
  if (!entries) return stories;

  const storybookRoot = path.resolve(ctx.root, storybook.root ?? ".");
  const byFile = new Map<string, Story[]>();
  for (const { type, id, name, importPath } of entries) {
    if (type !== "story" || !id || !name || !importPath) continue;
    const file = posix(path.relative(ctx.root, path.resolve(storybookRoot, importPath)));
    byFile.set(file, [...(byFile.get(file) ?? []), { id, name }]);
  }

  for (const component of components) {
    const found = component.stories!.flatMap((file) => {
      const inFile = byFile.get(file);
      if (!inFile) {
        ctx.logger.warn(
          `docs: ${component.name}: no story of ${file} in Storybook's index. Is \`storybook.root\` right?`,
        );
      }
      return inFile ?? [];
    });
    if (found.length > 0) stories.set(component.name, found);
  }
  return stories;
}
