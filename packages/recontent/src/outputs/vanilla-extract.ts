import {
  expandedMembers,
  isCompositeType,
  isExpandedComposite,
  isStampedToken,
  isTokenScale,
  type Config,
  type TokenEntry,
  type TokenScaleMetadata,
  type TokenType,
  type TokenTypeMap,
  type ThemeOverride,
  type TokenRegistry,
  pathKey,
} from "@recontentapp/core";
import { registryComponents } from "../registry/exports.js";
import {
  serializeCompositeCss,
  serializeValueCss,
  type MemberResolver,
} from "../core/generators/serialize.js";
import {
  generateBuiltInComponentFiles,
  getBuiltInComponentDependencies,
  MissingDesignTokensError,
  normalizeBuiltInComponents,
  resolveBuiltInComponentIds,
  validateBuiltInComponents,
} from "../registry/index.js";
import type { OutputFile, OutputProcessor, VanillaExtractOutput } from "./index.js";
import type { ScaleBinding, TokenBinding } from "@recontentapp/core";

type SourceValue = { value: string; source?: true };
type SourceTree = { [key: string]: SourceTree | SourceValue };

type ScaleExport = {
  metadata: TokenScaleMetadata;
  typeName: string;
  exportName: string;
};

function resolveEntryValue(
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

function isSourceValue(value: SourceTree | SourceValue): value is SourceValue {
  return typeof (value as SourceValue).value === "string";
}

function escapeString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function escapeTemplateLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function propertyAccess(root: string, path: readonly string[]): string {
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

function entryPath(entry: TokenEntry): string[] {
  return entry.layer === "components" ? entry.path : entry.path.slice(1);
}

function variableReference(entry: TokenEntry): string {
  return propertyAccess("vars", [entry.layer, ...entryPath(entry)]);
}

function resolveVariableReference(
  registry: Config["registry"],
  entry: TokenEntry,
  override?: ThemeOverride,
): string {
  const visited = new Set<string>();
  let current = entry;

  while (current.alias) {
    const key = pathKey(current.path);
    if (visited.has(key)) {
      throw new Error(`Circular alias detected at token path: ${key}`);
    }
    visited.add(key);

    const target = registry.get(pathKey(current.alias));
    if (!target) {
      throw new Error(`Alias target not found: ${pathKey(current.alias)}`);
    }
    current = target;
    if (override?.has(pathKey(current.path))) {
      break;
    }
  }

  return variableReference(current);
}

function resolveMemberReference(
  registry: TokenRegistry,
  memberAlias: string[],
  override: ThemeOverride | undefined,
): string {
  const target = registry.get(pathKey(memberAlias));
  if (!target) {
    throw new Error(`Alias target not found: ${pathKey(memberAlias)}`);
  }
  return resolveVariableReference(registry, target, override);
}

function setExpandedComposite(
  config: Config,
  tree: SourceTree,
  entry: TokenEntry,
  override: ThemeOverride | undefined,
): void {
  const type = entry.$type as "typography" | "transition";
  const base = [entry.layer, ...entryPath(entry)];
  const overridden = override?.get(pathKey(entry.path));

  if (overridden === undefined && entry.alias) {
    const target = config.registry.get(pathKey(entry.alias));
    if (!target) {
      throw new Error(`Alias target not found: ${pathKey(entry.alias)}`);
    }
    const targetRef = resolveVariableReference(config.registry, target, override);
    for (const { cssProperty } of expandedMembers(
      type,
      entry.$value as TokenTypeMap[typeof type],
    )) {
      setTreeValue(tree, [...base, cssProperty], {
        value: propertyAccess(targetRef, [cssProperty]),
        source: true,
      });
    }
    return;
  }

  const resolved = (overridden ?? entry.$value) as TokenTypeMap[typeof type];
  for (const { cssProperty, type: memberType, member } of expandedMembers(type, resolved)) {
    if (member.alias) {
      setTreeValue(tree, [...base, cssProperty], {
        value: resolveMemberReference(config.registry, member.alias, override),
        source: true,
      });
      continue;
    }
    setTreeValue(tree, [...base, cssProperty], {
      value: serializeValueCss(memberType, member.$value),
    });
  }
}

function setInlineComposite(
  config: Config,
  tree: SourceTree,
  entry: TokenEntry,
  override: ThemeOverride | undefined,
): void {
  const type = entry.$type as "shadow" | "border" | "gradient";
  const path = [entry.layer, ...entryPath(entry)];
  type InlineValue = TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"];
  const overridden = override?.get(pathKey(entry.path));

  if (overridden === undefined && entry.alias) {
    setTreeValue(tree, path, {
      value: resolveVariableReference(config.registry, entry, override),
      source: true,
    });
    return;
  }

  const value = (overridden ?? entry.$value) as InlineValue;
  const resolve: MemberResolver = (memberType, member) => {
    if (!member.alias) {
      return escapeTemplateLiteral(serializeValueCss(memberType, member.$value));
    }
    return `\${${resolveMemberReference(config.registry, member.alias, override)}}`;
  };
  const template = serializeCompositeCss(type, value, resolve);
  setTreeValue(tree, path, { value: `\`${template}\``, source: true });
}

function setTreeValue(tree: SourceTree, path: readonly string[], value: SourceValue): void {
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

function formatTree(tree: SourceTree, indent = "", contract = false): string {
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

function contractTree(config: Config): SourceTree {
  const tree: SourceTree = { ref: {}, system: {}, components: {} };
  for (const entry of config.registry.values()) {
    if (isExpandedComposite(entry.$type)) {
      const type = entry.$type as "typography" | "transition";
      for (const { cssProperty } of expandedMembers(
        type,
        entry.$value as TokenTypeMap[typeof type],
      )) {
        setTreeValue(tree, [entry.layer, ...entryPath(entry), cssProperty], { value: "" });
      }
      continue;
    }
    setTreeValue(tree, [entry.layer, ...entryPath(entry)], { value: "" });
  }
  return tree;
}

function valuesTree(config: Config, themeName?: string): SourceTree {
  const tree: SourceTree = { ref: {}, system: {}, components: {} };
  const override = themeName ? config.themes[themeName] : undefined;
  for (const entry of config.registry.values()) {
    if (isExpandedComposite(entry.$type)) {
      setExpandedComposite(config, tree, entry, override);
      continue;
    }
    if (isCompositeType(entry.$type)) {
      setInlineComposite(config, tree, entry, override);
      continue;
    }
    const value =
      entry.alias && !override?.has(pathKey(entry.path))
        ? {
            value: resolveVariableReference(config.registry, entry, override),
            source: true as const,
          }
        : {
            value: serializeValueCss(
              entry.$type,
              resolveEntryValue(
                config.registry,
                entry,
                override,
              ) as TokenTypeMap[typeof entry.$type],
            ),
          };
    setTreeValue(tree, [entry.layer, ...entryPath(entry)], value);
  }
  return tree;
}

function scaleNameSegments(scale: TokenScaleMetadata): string[] {
  return scale.path[0] === scale.layer ? scale.path : [scale.layer, ...scale.path];
}

function capitalizeSegment(segment: string): string {
  const normalized = segment.replace(/[^a-zA-Z0-9_$]/g, "");
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
}

function scaleExportNames(scale: TokenScaleMetadata): {
  typeName: string;
  exportName: string;
} {
  const typeName = scaleNameSegments(scale).map(capitalizeSegment).join("");
  return {
    typeName,
    exportName: typeName.charAt(0).toLowerCase() + typeName.slice(1),
  };
}

function scaleExportsForConfig(config: Config): ScaleExport[] {
  const scales = new Map<string, TokenScaleMetadata>();
  for (const entry of config.registry.values()) {
    if (entry.scale && (entry.scale.type === "color" || entry.scale.type === "dimension")) {
      scales.set(`${entry.scale.layer}:${pathKey(entry.scale.path)}`, entry.scale);
    }
  }
  return [...scales.values()].map((metadata) => ({
    metadata,
    ...scaleExportNames(metadata),
  }));
}

function generateScaleExports(scale: ScaleExport): string {
  const type = scale.metadata.keys
    .map((key) => (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(key) ? key : JSON.stringify(key)))
    .join(" | ");
  return `export type ${scale.typeName} = ${type};\n\nexport const ${scale.exportName} = ${propertyAccess("vars", [scale.metadata.layer, ...entryPath({ path: scale.metadata.path, layer: scale.metadata.layer } as TokenEntry)])};`;
}

function resolveScaleBinding<T extends TokenType>(
  registry: Config["registry"],
  scale: ScaleBinding<T>,
  expectedType: T,
  label: string,
): ScaleExport {
  if (!isTokenScale(scale) || scale.$type !== expectedType) {
    throw new Error(`Component config "${label}" must be a ${expectedType} TokenScale.`);
  }
  if (!scale._layer || !scale._path) {
    throw new Error(`Component config "${label}" must reference a defined token scale.`);
  }
  const found = [...registry.values()].find(
    (entry) =>
      entry.scale &&
      entry.scale.layer === scale._layer &&
      pathKey(entry.scale.path) === pathKey(scale._path ?? []),
  )?.scale;
  if (!found) {
    throw new Error(`Component config "${label}" references a scale with no generated export.`);
  }
  return { metadata: found, ...scaleExportNames(found) };
}

function resolveTokenBinding<T extends TokenType>(
  registry: Config["registry"],
  token: TokenBinding<T>,
  expectedType: T,
  label: string,
): { reference: string } {
  if (!isStampedToken(token) || token.$type !== expectedType) {
    throw new Error(`Component config "${label}" must be a ${expectedType} token.`);
  }
  const entry = registry.get(pathKey(token._path));
  if (!entry) {
    throw new Error(`Component config "${label}" references a token that is not registered.`);
  }
  // Component code preserves the path selected by the consumer. This avoids
  // rewriting a semantic system/component binding to its reference alias.
  return { reference: variableReference(entry) };
}

function generateVanillaExtractSource(
  config: Config,
  scaleExports: readonly ScaleExport[],
): string {
  const lines = [
    'import { createTheme, createThemeContract } from "@vanilla-extract/css";',
    "",
    `export const vars = createThemeContract(${formatTree(contractTree(config), "", true)});`,
    "",
    "export const refVars = vars.ref;",
    "export const systemVars = vars.system;",
    "export const componentVars = vars.components;",
    "",
    `export const themeClass = createTheme(vars, ${formatTree(valuesTree(config))});`,
  ];

  for (const themeName of Object.keys(config.themes).sort()) {
    lines.push(
      "",
      `export const ${themeName}ThemeClass = createTheme(vars, ${formatTree(valuesTree(config, themeName))});`,
    );
  }

  for (const scale of scaleExports) {
    lines.push("", generateScaleExports(scale));
  }
  return `${lines.join("\n")}\n`;
}

export const vanillaExtractOutputProcessor: OutputProcessor<VanillaExtractOutput> = {
  target: "vanilla-extract",
  generate(config: Config, output: VanillaExtractOutput): OutputFile[] {
    const selection = normalizeBuiltInComponents(output.builtInComponents);
    const builtInComponents = selection.names;
    const resolvedComponentIds = resolveBuiltInComponentIds(builtInComponents);

    if (builtInComponents.length > 0) {
      const errors = validateBuiltInComponents(
        config,
        builtInComponents,
        "vanilla-extract",
        selection.options,
      );
      if (errors.length > 0) {
        throw new MissingDesignTokensError(errors);
      }
    }

    const scaleExports = scaleExportsForConfig(config);
    const scaleBindings: Record<string, { typeName: string; exportName: string }> = {};
    const tokenBindings: Record<string, { reference: string }> = {};

    for (const id of resolvedComponentIds) {
      const component = registryComponents[id];
      if (!component) continue;
      const componentOptions =
        selection.options[component.name] ?? selection.options[component.id] ?? {};
      for (const contract of component.contracts) {
        const binding = (componentOptions as Record<string, unknown>)[contract.key];
        if (binding === undefined) continue;
        if (contract.kind === "token") {
          tokenBindings[`${id}.${contract.key}`] = resolveTokenBinding(
            config.registry,
            binding as TokenBinding<TokenType>,
            contract.type as TokenType,
            `${component.name}.${contract.key}`,
          );
        } else if (contract.kind === "scale") {
          const scale = resolveScaleBinding(
            config.registry,
            binding as ScaleBinding<TokenType>,
            contract.type as TokenType,
            `${component.name}.${contract.key}`,
          );
          scaleBindings[`${id}.${contract.key}`] = {
            typeName: scale.typeName,
            exportName: scale.exportName,
          };
        } else {
          const variants = binding as Record<string, Record<string, unknown>>;
          for (const [name, variant] of Object.entries(variants)) {
            for (const field of contract.fields) {
              tokenBindings[`${id}.${contract.key}.${name}.${field.key}`] = resolveTokenBinding(
                config.registry,
                variant[field.key] as TokenBinding<TokenType>,
                field.type as TokenType,
                `${component.name}.${contract.key}.${name}.${field.key}`,
              );
            }
          }
        }
      }
    }

    const files: OutputFile[] = [
      {
        filename: "tokens.css.ts",
        content: generateVanillaExtractSource(config, scaleExports),
      },
    ];
    if (builtInComponents.length > 0) {
      files.push(
        ...generateBuiltInComponentFiles(builtInComponents, "vanilla-extract", {
          scaleBindings,
          tokenBindings,
        }),
        {
          filename: "components.dependencies.json",
          content: `${JSON.stringify(
            getBuiltInComponentDependencies(builtInComponents, "vanilla-extract"),
            null,
            2,
          )}\n`,
        },
      );
    }
    return files;
  },
};
