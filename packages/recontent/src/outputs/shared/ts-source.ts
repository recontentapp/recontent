import type {
  ThemeOverride,
  TokenEntry,
  TokenLayer,
  TokenRegistry,
  TokenScaleMetadata,
} from "@recontentapp/core";
import { pathKey } from "@recontentapp/core";
import type { GeneratorContext } from "./context.js";

export type SourceValue = { value: string; source?: true };
export type SourceTree = { [key: string]: SourceTree | SourceValue };

export type ScaleExport = {
  metadata: TokenScaleMetadata;
  typeName: string;
  exportName: string;
};

function isSourceValue(value: SourceTree | SourceValue): value is SourceValue {
  return typeof (value as SourceValue).value === "string";
}

export function escapeString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function escapeTemplateLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

export function isNumericKey(key: string): boolean {
  return /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(key);
}

export function quotedKey(key: string): string {
  return isNumericKey(key) ? key : JSON.stringify(key);
}

export function propertyAccess(root: string, path: readonly string[]): string {
  return path.reduce(
    (reference, segment) =>
      /^[A-Za-z_$][\w$]*$/.test(segment)
        ? `${reference}.${segment}`
        : /^(?:0|[1-9]\d*)$/.test(segment)
          ? `${reference}[${segment}]`
          : `${reference}[${JSON.stringify(segment)}]`,
    root,
  );
}

export function entryPath(entry: { path: string[]; layer: TokenLayer }): string[] {
  return entry.layer === "components" ? entry.path : entry.path.slice(1);
}

export function resolveEntryValue(
  registry: TokenRegistry,
  entry: TokenEntry,
  overrides?: ThemeOverride,
): TokenEntry["$value"] {
  const visited = new Set<string>();

  function walk(current: TokenEntry): TokenEntry["$value"] {
    const key = pathKey(current.path);
    if (visited.has(key)) {
      throw new Error(`Circular alias detected at token path: ${key}`);
    }
    visited.add(key);

    const overridden = overrides?.get(key);
    if (overridden !== undefined) {
      return overridden;
    }
    if (!current.alias) {
      return current.$value;
    }

    const aliasKey = pathKey(current.alias);
    const aliased = registry.get(aliasKey);
    if (!aliased) {
      throw new Error(`Alias target not found: ${aliasKey}`);
    }
    return walk(aliased);
  }

  return walk(entry);
}

export function setTreeValue(
  tree: SourceTree,
  path: readonly string[],
  value: SourceValue | SourceTree,
): void {
  let current = tree;
  for (const segment of path.slice(0, -1)) {
    const child = current[segment];
    if (!child || "value" in child) {
      current[segment] = {};
    }
    current = current[segment] as SourceTree;
  }
  const key = path[path.length - 1];
  if (!key) {
    throw new Error("Cannot generate a token value without a path.");
  }
  current[key] = value;
}

export function formatTree(tree: SourceTree, indent = "", contract = false): string {
  const entries = Object.entries(tree);
  if (entries.length === 0) {
    return "{}";
  }

  const lines = entries.map(([key, value]) => {
    const keySource = JSON.stringify(key);
    if (isSourceValue(value)) {
      const serialized = contract
        ? "null"
        : value.source
          ? value.value
          : `'${escapeString(value.value)}'`;
      return `${indent}  ${keySource}: ${serialized},`;
    }
    return `${indent}  ${keySource}: ${formatTree(value, `${indent}  `, contract)},`;
  });
  return `{\n${lines.join("\n")}\n${indent}}`;
}

function scaleNameSegments(scale: TokenScaleMetadata): string[] {
  return scale.path[0] === scale.layer ? scale.path : [scale.layer, ...scale.path];
}

function capitalizeSegment(segment: string): string {
  const normalized = segment.replace(/[^a-zA-Z0-9_$]/g, "");
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
}

export function scaleExportNames(scale: TokenScaleMetadata): {
  typeName: string;
  exportName: string;
} {
  const typeName = scaleNameSegments(scale).map(capitalizeSegment).join("");
  return {
    typeName,
    exportName: typeName.charAt(0).toLowerCase() + typeName.slice(1),
  };
}

export function scaleExportsForConfig(config: GeneratorContext): ScaleExport[] {
  const scales = new Map<string, TokenScaleMetadata>();
  for (const entry of config.registry.values()) {
    if (entry.scale) {
      scales.set(`${entry.scale.layer}:${pathKey(entry.scale.path)}`, entry.scale);
    }
  }
  return [...scales.values()].map((metadata) => ({
    metadata,
    ...scaleExportNames(metadata),
  }));
}

export function generateScaleExports(scale: ScaleExport, root = "vars"): string {
  const type = scale.metadata.keys.map(quotedKey).join(" | ");
  return `export type ${scale.typeName} = ${type};\n\nexport const ${scale.exportName} = ${propertyAccess(root, [scale.metadata.layer, ...entryPath({ path: scale.metadata.path, layer: scale.metadata.layer })])};`;
}
