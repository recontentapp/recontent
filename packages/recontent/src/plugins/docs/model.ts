import { pathKey } from "../../token-model/guards.js";
import { type ComponentInfo } from "../../introspection/model.js";
import { type PluginContext } from "../types.js";
import { type TokenLayer } from "../../token-model/model.js";
import { buildToken, deprecation, type DocToken } from "../../snapshot/doc-token.js";

const DOC_LAYERS: TokenLayer[] = ["ref", "system", "components"];

export type DocGroup = {
  path: string;
  label: string;
  /** From the scale or `tokens.group(...)` the tokens belong to. */
  metadata?: { description?: string; deprecated?: true | string };
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
      const source = entry.scale ?? ctx.groups.get(groupPath);
      if (source && !group.metadata) {
        const deprecated = deprecation(source.$deprecated);
        group.metadata = {
          ...(source.$description !== undefined ? { description: source.$description } : {}),
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
