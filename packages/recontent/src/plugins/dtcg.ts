import { pathKey } from "../token-model/guards.js";
import { type PluginContext, type PluginDiagnostic, type RecontentPlugin } from "./types.js";
import type {
  DimensionValue,
  StrokeStyleValue,
  TokenType,
  TokenTypeMap,
} from "../token-model/values.js";
import {
  compositeMembers,
  isCompositeType,
  type CompositeTokenType,
} from "../token-model/composite.js";
import {
  type ThemeOverride,
  type TokenGroups,
  type TokenRegistry,
} from "../token-model/registry.js";
import type { TokenMetadata } from "../token-model/model.js";
import type { OutputFile } from "./shared/context.js";
import { entryToDtcgNode, setNested } from "../serialize/values.js";
import { themedEntry } from "../token-model/alias.js";
import type { GeneratorContext } from "./shared/context.js";
import { outputPlugin } from "./factory.js";

export type DtcgOutput = Record<string, unknown>;

function isConfig(input: TokenRegistry | GeneratorContext): input is GeneratorContext {
  return "registry" in input;
}

/** Writes the description, deprecation and extensions of scales and `tokens.group(...)` groups onto their DTCG groups. */
function applyGroupMetadata(
  output: DtcgOutput,
  registry: TokenRegistry,
  groups: TokenGroups | undefined,
): void {
  const seen = new Set<string>();
  const sources: Array<TokenMetadata & { path: string[]; layer: string }> = [];
  for (const entry of registry.values()) {
    if (entry.scale) sources.push(entry.scale);
  }
  sources.push(...(groups?.values() ?? []));

  for (const source of sources) {
    const key = `${source.layer}:${pathKey(source.path)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let group: unknown = output;
    for (const segment of source.path) {
      group = (group as Record<string, unknown> | undefined)?.[segment];
    }
    if (typeof group !== "object" || group === null) continue;

    const node = group as Record<string, unknown>;
    if (source.$description !== undefined) node.$description = source.$description;
    if (source.$deprecated !== undefined) node.$deprecated = source.$deprecated;
    if (source.$extensions !== undefined) node.$extensions = source.$extensions;
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

function hoistGroupTypes(output: DtcgOutput): DtcgOutput {
  hoistNode(output);
  return output;
}

export function generateDtcg(input: TokenRegistry | GeneratorContext): DtcgOutput {
  const registry = isConfig(input) ? input.registry : input;
  const output: DtcgOutput = {};

  for (const entry of registry.values()) {
    setNested(output, entry.path, entryToDtcgNode(entry));
  }

  applyGroupMetadata(output, registry, isConfig(input) ? input.groups : undefined);
  return hoistGroupTypes(output);
}

export function generateDtcgDelta(registry: TokenRegistry, override: ThemeOverride): DtcgOutput {
  for (const key of override.keys()) {
    if (!registry.has(key)) {
      throw new Error(`Theme override references an unknown token path: ${key}`);
    }
  }

  const output: DtcgOutput = {};
  for (const entry of registry.values()) {
    if (!override.has(pathKey(entry.path))) continue;
    const resolved = themedEntry(entry, override);
    const deltaEntry = {
      path: resolved.path,
      $type: resolved.$type,
      $value: resolved.$value,
      layer: resolved.layer,
      ...(resolved.alias ? { alias: resolved.alias } : {}),
    };
    setNested(output, deltaEntry.path, entryToDtcgNode(deltaEntry));
  }

  return hoistGroupTypes(output);
}

export function generateDtcgResolver(ctx: GeneratorContext): DtcgOutput {
  const multiAxis = ctx.themes.length > 1;
  const modifiers: Record<string, unknown> = {};

  for (const axis of ctx.themes) {
    const contexts: Record<string, unknown[]> = {
      [axis.default]: [],
    };
    for (const contextName of Object.keys(axis.contexts)) {
      const stem = multiAxis ? `${axis.name}-${contextName}` : contextName;
      contexts[contextName] = [{ $ref: `./themes/${stem}.tokens.json` }];
    }
    modifiers[axis.name] = {
      ...(axis.description !== undefined ? { description: axis.description } : {}),
      default: axis.default,
      contexts,
    };
  }

  return {
    $schema: "https://www.designtokens.org/schemas/2025.10/resolver.json",
    version: "2025.10",
    sets: {
      base: { sources: [{ $ref: "./tokens.tokens.json" }] },
    },
    modifiers,
    resolutionOrder: [
      { $ref: "#/sets/base" },
      ...ctx.themes.map((axis) => ({ $ref: `#/modifiers/${axis.name}` })),
    ],
  };
}

export type DtcgPluginOptions = {
  outDir: string;
};

export function generateDtcgFiles(
  ctx: GeneratorContext,
  _options: DtcgPluginOptions = { outDir: "" },
): OutputFile[] {
  const files: OutputFile[] = [
    {
      filename: "tokens.tokens.json",
      content: `${JSON.stringify(generateDtcg(ctx), null, 2)}\n`,
    },
  ];

  if (ctx.themes.length === 0) {
    return files;
  }

  files.push({
    filename: "tokens.resolver.json",
    content: `${JSON.stringify(generateDtcgResolver(ctx), null, 2)}\n`,
  });

  const multiAxis = ctx.themes.length > 1;
  for (const axis of ctx.themes) {
    for (const [contextName, override] of Object.entries(axis.contexts)) {
      const stem = multiAxis ? `${axis.name}-${contextName}` : contextName;
      files.push({
        filename: `themes/${stem}.tokens.json`,
        content: `${JSON.stringify(generateDtcgDelta(ctx.registry, override), null, 2)}\n`,
      });
    }
  }

  return files;
}

/** Where a literal value (not an alias) is a dimension in `em`: the value itself, or the members of a composite. */
function emDimensionLocations(type: TokenType, value: unknown): string[] {
  const isEm = (candidate: unknown) => (candidate as DimensionValue).unit === "em";
  if (type === "dimension") return isEm(value) ? [""] : [];
  if (type === "strokeStyle") {
    const stroke = value as StrokeStyleValue;
    return "dashArray" in stroke &&
      stroke.dashArray.some((member) => !member.alias && isEm(member.$value))
      ? ["dashArray"]
      : [];
  }
  if (!isCompositeType(type)) return [];
  return compositeMembers(type, value as TokenTypeMap[CompositeTokenType])
    .filter(({ type: memberType, member }) => memberType === "dimension" && !member.alias)
    .filter(({ member }) => isEm(member.$value))
    .map(({ key }) => key);
}

/** DTCG has no `em`, so those dimensions are exported as `rem` with the same value, which is relative to something else. */
function emDimensionWarnings(ctx: PluginContext): PluginDiagnostic[] {
  const multiAxis = ctx.themes.length > 1;
  const sources = [
    ...[...ctx.registry.values()].map((entry) => ({ ...entry, where: "" })),
    ...ctx.themes.flatMap((axis) =>
      Object.entries(axis.contexts).flatMap(([contextName, override]) => {
        const label = multiAxis ? `${axis.name}=${contextName}` : contextName;
        return [...override.keys()].flatMap((key) => {
          const entry = ctx.registry.get(key);
          return entry ? [{ ...themedEntry(entry, override), where: ` in theme "${label}"` }] : [];
        });
      }),
    ),
  ];
  return sources
    .filter((source) => !source.alias)
    .flatMap((source) =>
      emDimensionLocations(source.$type, source.$value).map((location) => ({
        severity: "warning" as const,
        path: source.path,
        message: `"${pathKey(source.path)}${location && `.${location}`}"${source.where} is in "em", which DTCG does not support: it is exported as "rem" with the same value. Use "rem" or "px" instead.`,
      })),
    );
}

function themeFileDiagnostics(ctx: PluginContext): PluginDiagnostic[] {
  const diagnostics: PluginDiagnostic[] = [];
  const multiAxis = ctx.themes.length > 1;
  const seen = new Map<string, { stem: string; label: string }>();

  for (const axis of ctx.themes) {
    for (const contextName of Object.keys(axis.contexts)) {
      const stem = multiAxis ? `${axis.name}-${contextName}` : contextName;
      const label = multiAxis ? `${axis.name}=${contextName}` : contextName;
      const lower = stem.toLowerCase();
      const previous = seen.get(lower);
      if (previous) {
        diagnostics.push({
          severity: "error",
          message:
            previous.stem === stem
              ? `Themes "${previous.label}" and "${label}" both write themes/${stem}.tokens.json; rename an axis or context.`
              : `Themes "${previous.label}" and "${label}" differ only by case (themes/${previous.stem}.tokens.json vs themes/${stem}.tokens.json) and would collide on case-insensitive filesystems; rename one.`,
        });
      } else {
        seen.set(lower, { stem, label });
      }
    }
  }
  return diagnostics;
}

export function dtcg(options: DtcgPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:dtcg", ["tokens"], options, generateDtcgFiles, (ctx) => [
    ...themeFileDiagnostics(ctx),
    ...emDimensionWarnings(ctx),
  ]);
}
