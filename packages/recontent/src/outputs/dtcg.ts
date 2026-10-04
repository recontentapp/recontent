import {
  pathKey,
  type OutputFile,
  type ThemeOverride,
  type TokenEntry,
  type TokenRegistry,
} from "@recontentapp/core";
import { entryToDtcgNode, setNested } from "../serialize/values.js";
import type { GeneratorContext } from "./shared/context.js";

export type DtcgOutput = Record<string, unknown>;

function isConfig(input: TokenRegistry | GeneratorContext): input is GeneratorContext {
  return "registry" in input;
}

function resolveThemedEntry(entry: TokenEntry, themeOverride: ThemeOverride): TokenEntry {
  const key = pathKey(entry.path);
  const overridden = themeOverride.get(key);
  if (!overridden) {
    return entry;
  }

  return {
    path: entry.path,
    $type: entry.$type,
    $value: overridden,
    layer: entry.layer,
    ...(entry.$description !== undefined ? { $description: entry.$description } : {}),
    ...(entry.$deprecated !== undefined ? { $deprecated: entry.$deprecated } : {}),
    ...(entry.$extensions !== undefined ? { $extensions: entry.$extensions } : {}),
  };
}

function applyScaleMetadata(output: DtcgOutput, registry: TokenRegistry): void {
  const seen = new Set<string>();
  for (const entry of registry.values()) {
    const scale = entry.scale;
    if (!scale) continue;
    const key = `${scale.layer}:${pathKey(scale.path)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let group: unknown = output;
    for (const segment of scale.path) {
      group = (group as Record<string, unknown> | undefined)?.[segment];
    }
    if (typeof group !== "object" || group === null) continue;

    const node = group as Record<string, unknown>;
    if (scale.$description !== undefined) node.$description = scale.$description;
    if (scale.$deprecated !== undefined) node.$deprecated = scale.$deprecated;
    if (scale.$extensions !== undefined) node.$extensions = scale.$extensions;
  }
}

function isTokenNode(node: unknown): node is Record<string, unknown> {
  return typeof node === "object" && node !== null && "$value" in node;
}

function hoistNode(node: Record<string, unknown>): { types: Set<string>; count: number } {
  const types = new Set<string>();
  let count = 0;

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (isTokenNode(child)) {
      types.add(child.$type as string);
      count += 1;
      continue;
    }
    if (typeof child === "object" && child !== null) {
      const result = hoistNode(child as Record<string, unknown>);
      count += result.count;
      for (const type of result.types) types.add(type);
    }
  }

  if (types.size === 1 && count >= 2) {
    const [type] = types;
    node.$type = type;
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      if (
        typeof child === "object" &&
        child !== null &&
        (child as Record<string, unknown>).$type === type
      ) {
        delete (child as Record<string, unknown>).$type;
      }
    }
  }

  return { types, count };
}

export function hoistGroupTypes(output: DtcgOutput): DtcgOutput {
  hoistNode(output);
  return output;
}

export function generateDtcg(input: TokenRegistry | GeneratorContext): DtcgOutput {
  const registry = isConfig(input) ? input.registry : input;
  const output: DtcgOutput = {};

  for (const entry of registry.values()) {
    setNested(output, entry.path, entryToDtcgNode(entry));
  }

  applyScaleMetadata(output, registry);
  return hoistGroupTypes(output);
}

export function generateDtcgThemed(ctx: GeneratorContext, themeName: string): DtcgOutput {
  const themeOverride = ctx.themes[themeName];
  if (!themeOverride) {
    throw new Error(
      `Theme "${themeName}" is not defined in the config. Available themes: ${Object.keys(ctx.themes).join(", ") || "(none)"}`,
    );
  }

  const output: DtcgOutput = {};

  for (const entry of ctx.registry.values()) {
    const resolved = resolveThemedEntry(entry, themeOverride);
    setNested(output, resolved.path, entryToDtcgNode(resolved));
  }

  applyScaleMetadata(output, ctx.registry);
  return hoistGroupTypes(output);
}

export type DtcgPluginOptions = {
  outDir: string;
};

export function generateDtcgFiles(
  ctx: GeneratorContext,
  _options: DtcgPluginOptions,
): OutputFile[] {
  const files: OutputFile[] = [
    {
      filename: "tokens.tokens.json",
      content: JSON.stringify(generateDtcg(ctx), null, 2),
    },
  ];

  for (const themeName of Object.keys(ctx.themes).sort()) {
    files.push({
      filename: `${themeName}.tokens.json`,
      content: JSON.stringify(generateDtcgThemed(ctx, themeName), null, 2),
    });
  }

  return files;
}
