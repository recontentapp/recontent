import {
  isCompositeType,
  pathKey,
  type Logger,
  type ThemeOverride,
  type TokenEntry,
  type TokenLayer,
  type TokenRegistry,
  type TokenType,
  type TokenTypeMap,
} from "@recontentapp/core";
import type { GeneratorContext } from "./context.js";
import {
  entryPath,
  formatTree,
  propertyAccess,
  resolveEntryValue,
  scaleExportsForConfig,
  setTreeValue,
  type ScaleExport,
  type SourceTree,
  type SourceValue,
} from "./ts-source.js";

type LossReporter = (tokenPath: string[], message: string) => void;

export type MemberLookup = (memberAlias: string[]) => {
  ref?: string;
  value: TokenTypeMap[TokenType];
};

export interface ThemeTargetSpec {
  scalar(
    type: TokenType,
    value: TokenTypeMap[TokenType],
    report: LossReporter,
    path: string[],
  ): SourceValue;
  composite(
    entry: TokenEntry,
    resolved: TokenTypeMap[TokenType],
    member: MemberLookup,
    report: LossReporter,
  ): SourceValue | SourceTree;
}

const LAYERS: readonly TokenLayer[] = ["ref", "system", "components"];
const LAYER_INDEX: Record<TokenLayer, number> = Object.fromEntries(
  LAYERS.map((layer, index) => [layer, index]),
) as Record<TokenLayer, number>;

const JS_RESERVED_WORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "let",
  "static",
  "enum",
  "await",
  "implements",
  "package",
  "protected",
  "interface",
  "private",
  "public",
  "null",
  "true",
  "false",
]);

const IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;
export const CSS_IDENTIFIER_RE = /^[A-Za-z_][\w-]*$/;
const THEME_ATTRIBUTE_RE = /^[A-Za-z][\w-]*$/;

export function validateThemeNames(
  themeNames: readonly string[],
  target: string,
  options?: { pattern?: RegExp; description?: string },
): void {
  const pattern = options?.pattern ?? IDENTIFIER_RE;
  const description = options?.description ?? "theme names must be valid TypeScript identifiers";
  for (const name of themeNames) {
    if (!pattern.test(name)) {
      throw new Error(
        `Theme name "${name}" cannot be used with the "${target}" output target: ${description}.`,
      );
    }
  }
}

export function validateThemeAttribute(themeAttribute: string, target: string): void {
  if (!THEME_ATTRIBUTE_RE.test(themeAttribute)) {
    throw new Error(
      `themeAttribute "${themeAttribute}" cannot be used with the "${target}" output target: it must match ${THEME_ATTRIBUTE_RE}.`,
    );
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function themeConstName(themeName: string | undefined): string {
  return themeName === undefined ? "theme" : themeName;
}

function layerConstName(themeName: string | undefined, layer: TokenLayer): string {
  return `${themeConstName(themeName)}${capitalize(layer)}`;
}

function validateIdentifierGuards(
  config: GeneratorContext,
  target: string,
  scaleExports: readonly ScaleExport[],
): void {
  const themeNames = Object.keys(config.themes);
  validateThemeNames(themeNames, target);

  const reserved = new Set<string>([
    "theme",
    "themes",
    "Theme",
    "ThemeName",
    "BaseTheme",
    "themeRef",
    "themeSystem",
    "themeComponents",
    ...JS_RESERVED_WORDS,
  ]);

  for (const name of themeNames) {
    const identifiers = [
      themeConstName(name),
      ...LAYERS.map((layer) => layerConstName(name, layer)),
    ];
    for (const identifier of identifiers) {
      if (reserved.has(identifier)) {
        throw new Error(
          `Theme name "${name}" cannot be used with the "${target}" output target: identifier "${identifier}" collides with a reserved export name.`,
        );
      }
    }
    for (const identifier of identifiers) {
      reserved.add(identifier);
    }
  }

  const groups = new Map<string, string[]>();
  for (const scale of scaleExports) {
    const path = pathKey([scale.metadata.layer, ...scale.metadata.path]);
    const list = groups.get(scale.typeName) ?? [];
    list.push(path);
    groups.set(scale.typeName, list);
  }
  for (const [typeName, paths] of groups) {
    if (paths.length > 1) {
      throw new Error(
        `Scale export name "${typeName}" collides between token paths ${paths.join(" and ")} with the "${target}" output target. Rename one of these scales.`,
      );
    }
  }
}

// Not a `terminalEntry` (plugins/shared/alias.ts) walk: this tracks the last
// candidate in an *earlier* layer than the one being emitted, rather than
// the final entry in the chain, and can stop early on a theme override.
function resolveAliasCandidate(
  registry: TokenRegistry,
  seedPath: string[],
  startAliasPath: string[],
  override: ThemeOverride | undefined,
  emittingLayerIndex: number,
): TokenEntry | undefined {
  let candidate: TokenEntry | undefined;
  const visited = new Set<string>([pathKey(seedPath)]);
  let aliasPath: string[] | undefined = startAliasPath;

  while (aliasPath) {
    const key = pathKey(aliasPath);
    if (visited.has(key)) {
      throw new Error(`Circular alias detected at token path: ${key}`);
    }
    const target = registry.get(key);
    if (!target) {
      throw new Error(`Alias target not found: ${key}`);
    }
    visited.add(key);

    if (LAYER_INDEX[target.layer] < emittingLayerIndex) {
      candidate = target;
    }
    if (override?.has(key)) {
      break;
    }
    aliasPath = target.alias;
  }

  return candidate;
}

function emitScalarEntry(
  tree: SourceTree,
  entry: TokenEntry,
  registry: TokenRegistry,
  override: ThemeOverride | undefined,
  themeName: string | undefined,
  spec: ThemeTargetSpec,
  report: LossReporter,
): void {
  const overridden = override?.get(pathKey(entry.path));
  if (overridden !== undefined) {
    setTreeValue(
      tree,
      entryPath(entry),
      spec.scalar(entry.$type, overridden as TokenTypeMap[TokenType], report, entry.path),
    );
    return;
  }

  if (entry.alias) {
    const candidate = resolveAliasCandidate(
      registry,
      entry.path,
      entry.alias,
      override,
      LAYER_INDEX[entry.layer],
    );
    if (candidate) {
      setTreeValue(tree, entryPath(entry), {
        value: propertyAccess(layerConstName(themeName, candidate.layer), entryPath(candidate)),
        source: true,
      });
      return;
    }

    const resolved = resolveEntryValue(registry, entry, override);
    setTreeValue(
      tree,
      entryPath(entry),
      spec.scalar(entry.$type, resolved as TokenTypeMap[TokenType], report, entry.path),
    );
    return;
  }

  setTreeValue(tree, entryPath(entry), spec.scalar(entry.$type, entry.$value, report, entry.path));
}

function emitCompositeEntry(
  tree: SourceTree,
  entry: TokenEntry,
  registry: TokenRegistry,
  override: ThemeOverride | undefined,
  themeName: string | undefined,
  spec: ThemeTargetSpec,
  report: LossReporter,
): void {
  const overridden = override?.get(pathKey(entry.path));

  if (overridden === undefined && entry.alias) {
    const candidate = resolveAliasCandidate(
      registry,
      entry.path,
      entry.alias,
      override,
      LAYER_INDEX[entry.layer],
    );
    if (candidate) {
      setTreeValue(tree, entryPath(entry), {
        value: propertyAccess(layerConstName(themeName, candidate.layer), entryPath(candidate)),
        source: true,
      });
      return;
    }
  }

  const resolvedValue = (overridden ?? entry.$value) as TokenTypeMap[TokenType];
  const member = (memberAlias: string[]): { ref?: string; value: TokenTypeMap[TokenType] } => {
    const target = registry.get(pathKey(memberAlias));
    if (!target) {
      throw new Error(`Alias target not found: ${pathKey(memberAlias)}`);
    }
    const value = resolveEntryValue(registry, target, override) as TokenTypeMap[TokenType];
    const candidate = resolveAliasCandidate(
      registry,
      entry.path,
      memberAlias,
      override,
      LAYER_INDEX[entry.layer],
    );
    if (candidate) {
      return {
        ref: propertyAccess(layerConstName(themeName, candidate.layer), entryPath(candidate)),
        value,
      };
    }
    return { value };
  };

  const node = spec.composite(entry, resolvedValue, member, report);
  setTreeValue(tree, entryPath(entry), node);
}

export function generateThemeSource(
  config: GeneratorContext,
  spec: ThemeTargetSpec,
  logger: Logger,
  target: string,
): string {
  const scaleExports = scaleExportsForConfig(config);
  validateIdentifierGuards(config, target, scaleExports);

  const warned = new Set<string>();
  const report: LossReporter = (path, message) => {
    const key = `${pathKey(path)}::${message}`;
    if (warned.has(key)) return;
    warned.add(key);
    logger.warn(message);
  };

  const themeNames = Object.keys(config.themes).sort();
  const lines: string[] = [];

  const entriesByLayer = new Map<TokenLayer, TokenEntry[]>(LAYERS.map((layer) => [layer, []]));
  for (const entry of config.registry.values()) {
    entriesByLayer.get(entry.layer)!.push(entry);
  }

  for (const themeName of [undefined, ...themeNames]) {
    const override = themeName ? config.themes[themeName] : undefined;

    for (const layer of LAYERS) {
      const tree: SourceTree = {};
      for (const entry of entriesByLayer.get(layer)!) {
        if (isCompositeType(entry.$type)) {
          emitCompositeEntry(tree, entry, config.registry, override, themeName, spec, report);
        } else {
          emitScalarEntry(tree, entry, config.registry, override, themeName, spec, report);
        }
      }
      lines.push(`const ${layerConstName(themeName, layer)} = ${formatTree(tree)} as const;`, "");
    }

    lines.push(
      `export const ${themeConstName(themeName)} = { ref: ${layerConstName(themeName, "ref")}, system: ${layerConstName(themeName, "system")}, components: ${layerConstName(themeName, "components")} };`,
      "",
    );
  }

  return lines.join("\n");
}
