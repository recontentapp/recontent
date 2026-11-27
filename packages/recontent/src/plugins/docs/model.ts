import { pathKey } from "../../token-model/guards.js";
import { type ComponentInfo } from "../../introspection/model.js";
import { type PluginContext } from "../types.js";
import { type TokenLayer } from "../../token-model/model.js";
import { buildToken, deprecation, type DocToken } from "../../snapshot/doc-token.js";
import {
  numericCompare,
  toSnapshotThemes,
  type SnapshotThemeAxis,
} from "../../snapshot/snapshot.js";

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
  themes: SnapshotThemeAxis[];
  tokenCount: number;
  layers: DocLayer[];
  components: ComponentInfo[];
};

export function buildDocsModel(ctx: PluginContext, title: string): DocsModel {
  const themes = toSnapshotThemes(ctx.themes);
  const entries = [...ctx.registry.values()]
    .map((entry) => ({ key: pathKey(entry.path), entry }))
    .sort((a, b) => numericCompare(a.key, b.key));

  const groupsByLayer = new Map<TokenLayer, Map<string, DocGroup>>(
    DOC_LAYERS.map((layer) => [layer, new Map()]),
  );

  for (const { entry } of entries) {
    const groups = groupsByLayer.get(entry.layer)!;
    const groupPath = pathKey(entry.path.slice(0, -1));
    let group = groups.get(groupPath);
    if (!group) {
      group = { path: groupPath, label: groupPath || entry.layer, tokens: [] };
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
    group.tokens.push(buildToken(ctx, entry));
  }

  const layers: DocLayer[] = DOC_LAYERS.map((layer) => ({
    layer,
    groups: [...groupsByLayer.get(layer)!.values()],
  }));

  return {
    title,
    themes,
    tokenCount: ctx.registry.size,
    layers,
    components: ctx.components ?? [],
  };
}
