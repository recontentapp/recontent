import {
  expandedMembers,
  isCompositeType,
  isExpandedComposite,
  isStampedToken,
  isTokenScale,
  type Config,
  type TokenEntry,
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
import {
  entryPath,
  escapeTemplateLiteral,
  formatTree,
  generateScaleExports,
  propertyAccess,
  resolveEntryValue,
  scaleExportNames,
  scaleExportsForConfig,
  setTreeValue,
  type ScaleExport,
  type SourceTree,
} from "./shared/ts-source.js";

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
