import {
  pathKey,
  type ComponentInfo,
  type PluginContext,
  type TokenLayer,
} from "@recontentapp/core";
import { buildToken, deprecation, type DocToken } from "../shared/doc-token.js";

const DOC_LAYERS: TokenLayer[] = ["ref", "system", "components"];

export type DocGroup = {
  path: string;
  label: string;
  scale?: { description?: string; deprecated?: true | string };
  tokens: DocToken[];
};

type DocLayer = { layer: TokenLayer; groups: DocGroup[] };

export type DocsModel = {
  title: string;
  themes: string[];
  tokenCount: number;
  layers: DocLayer[];
  components: ComponentInfo[];
};

const numericCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

export function buildDocsModel(ctx: PluginContext, title: string): DocsModel {
  const themes = Object.keys(ctx.themes);
  const entries = [...ctx.registry.values()].sort((a, b) =>
    numericCompare(pathKey(a.path), pathKey(b.path)),
  );

  const layers: DocLayer[] = DOC_LAYERS.map((layer) => {
    const groups = new Map<string, DocGroup>();
    for (const entry of entries) {
      if (entry.layer !== layer) continue;
      const groupPath = pathKey(entry.path.slice(0, -1));
      let group = groups.get(groupPath);
      if (!group) {
        group = { path: groupPath, label: groupPath || layer, tokens: [] };
        groups.set(groupPath, group);
      }
      if (entry.scale && !group.scale) {
        const deprecated = deprecation(entry.scale.$deprecated);
        group.scale = {
          ...(entry.scale.$description !== undefined
            ? { description: entry.scale.$description }
            : {}),
          ...(deprecated !== undefined ? { deprecated } : {}),
        };
      }
      group.tokens.push(buildToken(ctx, entry, themes));
    }
    return { layer, groups: [...groups.values()] };
  });

  return {
    title,
    themes,
    tokenCount: ctx.registry.size,
    layers,
    components: ctx.components ?? [],
  };
}
