/**
 * StyleX cannot reference a var from a different `defineVars` group, so the
 * base spike (see plan) confirmed all three token layers must live in ONE
 * `defineVars` call with flat, layer-prefixed keys. Aliases are preserved as
 * derived functions (`key: () => \`${vars.target}\``), which StyleX resolves
 * through arbitrarily long chains. `createTheme` overrides, by contrast, only
 * ever compile to CSS when given a *literal* value — a derived-function
 * override value silently produces no CSS rule (verified empirically against
 * @stylexjs/babel-plugin 0.19.0) — so every theme override below is flattened
 * to a literal via `serializeValueCss`/`member.$value`, never re-aliased.
 * This is safe: CSS custom-property cascade means overriding a single
 * upstream var (e.g. a ref color) already propagates to every token that
 * aliases it, without needing to redeclare the intermediate keys.
 */
import {
  expandedMembers,
  isCompositeType,
  isExpandedComposite,
  isStampedToken,
  pathKey,
  type OutputFile,
  type ThemeOverride,
  type TokenEntry,
  type TokenRegistry,
  type TokenTypeMap,
  type TokenType,
} from "@recontentapp/core";
import {
  serializeCompositeCss,
  serializeValueCss,
  type MemberResolver,
} from "../serialize/values.js";
import type { GeneratorContext } from "./shared/context.js";
import { generateCssResetStylesheet } from "./shared/reset.js";
import { buildKeyMap } from "./shared/stylex-keys.js";
import {
  escapeString,
  escapeTemplateLiteral,
  resolveEntryValue,
  scaleExportsForConfig,
  type ScaleExport,
} from "./shared/ts-source.js";
import type { TokenBinding } from "@recontentapp/core";

type VarLine = { key: string; expression: string; derived: boolean };

function quoteLiteral(value: string): string {
  return `'${escapeString(value)}'`;
}

function derivedTemplate(reference: string): string {
  return `() => \`\${${reference}}\``;
}

function resolveVariableReference(
  registry: TokenRegistry,
  keys: Map<string, string>,
  entry: TokenEntry,
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
  }

  const flat = keys.get(pathKey(current.path));
  if (!flat) {
    throw new Error(`Missing generated StyleX key for token path: ${pathKey(current.path)}`);
  }
  return `vars.${flat}`;
}

function resolveMemberReference(
  registry: TokenRegistry,
  keys: Map<string, string>,
  memberAlias: string[],
): string {
  const target = registry.get(pathKey(memberAlias));
  if (!target) {
    throw new Error(`Alias target not found: ${pathKey(memberAlias)}`);
  }
  return resolveVariableReference(registry, keys, target);
}

/**
 * Post-order DFS over the alias graph: dependencies (alias/member targets)
 * are visited before the entry that references them, so by the time an entry
 * is emitted into the `defineVars` object literal, every key its derived
 * function reads already exists earlier in the same literal.
 */
function topologicalEntries(config: GeneratorContext): TokenEntry[] {
  const { registry } = config;
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const order: TokenEntry[] = [];

  function dependencies(entry: TokenEntry): string[] {
    if (entry.alias) {
      return [pathKey(entry.alias)];
    }
    if (isExpandedComposite(entry.$type)) {
      const type = entry.$type as "typography" | "transition";
      return expandedMembers(type, entry.$value as TokenTypeMap[typeof type])
        .filter(({ member }) => member.alias)
        .map(({ member }) => pathKey(member.alias!));
    }
    if (isCompositeType(entry.$type)) {
      const type = entry.$type as "shadow" | "border" | "gradient";
      const value = entry.$value as
        | TokenTypeMap["shadow"]
        | TokenTypeMap["border"]
        | TokenTypeMap["gradient"];
      const members = collectCompositeMemberAliases(type, value);
      return members;
    }
    return [];
  }

  function visit(key: string): void {
    if (visited.has(key)) return;
    if (visiting.has(key)) {
      throw new Error(`Circular alias detected at token path: ${key}`);
    }
    const entry = registry.get(key);
    if (!entry) {
      throw new Error(`Alias target not found: ${key}`);
    }
    visiting.add(key);
    for (const dependency of dependencies(entry)) {
      visit(dependency);
    }
    visiting.delete(key);
    visited.add(key);
    order.push(entry);
  }

  for (const key of registry.keys()) {
    visit(key);
  }

  return order;
}

function collectCompositeMemberAliases(
  type: "shadow" | "border" | "gradient",
  value: TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
): string[] {
  const aliases: string[] = [];
  const resolve: MemberResolver = (_memberType, member) => {
    if (member.alias) {
      aliases.push(pathKey(member.alias));
    }
    return "";
  };
  serializeCompositeCss(type, value, resolve);
  return aliases;
}

function expandedVarLines(
  config: GeneratorContext,
  keys: Map<string, string>,
  entry: TokenEntry,
): VarLine[] {
  const type = entry.$type as "typography" | "transition";
  const base = pathKey(entry.path);

  if (entry.alias) {
    const target = config.registry.get(pathKey(entry.alias));
    if (!target) {
      throw new Error(`Alias target not found: ${pathKey(entry.alias)}`);
    }
    // Walk to the terminal (non-alias) entry sharing this composite's shape,
    // so each cssProperty references that entry's own flattened member key.
    const visited = new Set<string>();
    let current = target;
    while (current.alias) {
      const key = pathKey(current.path);
      if (visited.has(key)) {
        throw new Error(`Circular alias detected at token path: ${key}`);
      }
      visited.add(key);
      const next = config.registry.get(pathKey(current.alias));
      if (!next) {
        throw new Error(`Alias target not found: ${pathKey(current.alias)}`);
      }
      current = next;
    }
    const targetBase = pathKey(current.path);
    return expandedMembers(type, entry.$value as TokenTypeMap[typeof type]).map(
      ({ cssProperty }) => {
        const flat = keys.get(`${base}.${cssProperty}`)!;
        const targetFlat = keys.get(`${targetBase}.${cssProperty}`);
        if (!targetFlat) {
          throw new Error(
            `Missing generated StyleX key for token path: ${targetBase}.${cssProperty}`,
          );
        }
        return { key: flat, expression: derivedTemplate(`vars.${targetFlat}`), derived: true };
      },
    );
  }

  return expandedMembers(type, entry.$value as TokenTypeMap[typeof type]).map(
    ({ cssProperty, type: memberType, member }) => {
      const flat = keys.get(`${base}.${cssProperty}`)!;
      if (member.alias) {
        const reference = resolveMemberReference(config.registry, keys, member.alias);
        return { key: flat, expression: derivedTemplate(reference), derived: true };
      }
      return {
        key: flat,
        expression: quoteLiteral(serializeValueCss(memberType, member.$value)),
        derived: false,
      };
    },
  );
}

function inlineCompositeVarLine(
  config: GeneratorContext,
  keys: Map<string, string>,
  entry: TokenEntry,
): VarLine {
  const type = entry.$type as "shadow" | "border" | "gradient";
  const flat = keys.get(pathKey(entry.path))!;

  if (entry.alias) {
    const reference = resolveVariableReference(config.registry, keys, entry);
    return { key: flat, expression: derivedTemplate(reference), derived: true };
  }

  const value = entry.$value as
    | TokenTypeMap["shadow"]
    | TokenTypeMap["border"]
    | TokenTypeMap["gradient"];
  let hasAlias = false;
  const resolve: MemberResolver = (memberType, member) => {
    if (!member.alias) {
      return escapeTemplateLiteral(serializeValueCss(memberType, member.$value));
    }
    hasAlias = true;
    return `\${${resolveMemberReference(config.registry, keys, member.alias)}}`;
  };
  const template = serializeCompositeCss(type, value, resolve);

  if (!hasAlias) {
    return { key: flat, expression: quoteLiteral(template), derived: false };
  }
  return { key: flat, expression: `() => \`${template}\``, derived: true };
}

function scalarVarLine(
  config: GeneratorContext,
  keys: Map<string, string>,
  entry: TokenEntry,
): VarLine {
  const flat = keys.get(pathKey(entry.path))!;
  if (entry.alias) {
    const reference = resolveVariableReference(config.registry, keys, entry);
    return { key: flat, expression: derivedTemplate(reference), derived: true };
  }
  return {
    key: flat,
    expression: quoteLiteral(serializeValueCss(entry.$type, entry.$value)),
    derived: false,
  };
}

function tokenVarLines(config: GeneratorContext, keys: Map<string, string>): VarLine[] {
  const lines: VarLine[] = [];
  for (const entry of topologicalEntries(config)) {
    if (isExpandedComposite(entry.$type)) {
      lines.push(...expandedVarLines(config, keys, entry));
      continue;
    }
    if (isCompositeType(entry.$type)) {
      lines.push(inlineCompositeVarLine(config, keys, entry));
      continue;
    }
    lines.push(scalarVarLine(config, keys, entry));
  }
  return lines;
}

function formatVarLines(lines: readonly VarLine[], indent = "  "): string {
  if (lines.length === 0) return "{}";
  const body = lines.map(({ key, expression }) => `${indent}${key}: ${expression},`).join("\n");
  return `{\n${body}\n${indent.slice(2)}}`;
}

function generateVarsSource(config: GeneratorContext, keys: Map<string, string>): string {
  const lines = tokenVarLines(config, keys);
  return [
    // Derived entries (`() => \`${vars.other}\``) reference `vars` from inside
    // its own initializer. TS's real `defineVars` generic (unlike a plain
    // identity function) needs to fully resolve the argument's type to infer
    // the call's return type, which makes that self-reference circular and
    // raises TS7022. `@ts-nocheck` is the standard escape hatch for generated
    // files hitting inference limits like this one.
    "// @ts-nocheck",
    'import * as stylex from "@stylexjs/stylex";',
    "",
    `export const vars = stylex.defineVars(${formatVarLines(lines)});`,
    "",
  ].join("\n");
}

function themeOverrideLines(
  config: GeneratorContext,
  keys: Map<string, string>,
  override: ThemeOverride,
): VarLine[] {
  const lines: VarLine[] = [];
  const paths = [...override.keys()].sort();

  for (const path of paths) {
    const entry = config.registry.get(path);
    if (!entry) {
      throw new Error(`Theme override references an unknown token path: ${path}`);
    }
    const value = override.get(path)!;

    if (isExpandedComposite(entry.$type)) {
      const type = entry.$type as "typography" | "transition";
      for (const { cssProperty, type: memberType, member } of expandedMembers(
        type,
        value as TokenTypeMap[typeof type],
      )) {
        const flat = keys.get(`${path}.${cssProperty}`);
        if (!flat) {
          throw new Error(`Missing generated StyleX key for token path: ${path}.${cssProperty}`);
        }
        lines.push({
          key: flat,
          expression: quoteLiteral(serializeValueCss(memberType, member.$value)),
          derived: false,
        });
      }
      continue;
    }

    if (isCompositeType(entry.$type)) {
      const type = entry.$type as "shadow" | "border" | "gradient";
      const flat = keys.get(path);
      if (!flat) {
        throw new Error(`Missing generated StyleX key for token path: ${path}`);
      }
      const resolve: MemberResolver = (memberType, member) =>
        escapeTemplateLiteral(serializeValueCss(memberType, member.$value));
      const template = serializeCompositeCss(
        type,
        value as TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
        resolve,
      );
      lines.push({ key: flat, expression: quoteLiteral(template), derived: false });
      continue;
    }

    const flat = keys.get(path);
    if (!flat) {
      throw new Error(`Missing generated StyleX key for token path: ${path}`);
    }
    lines.push({
      key: flat,
      expression: quoteLiteral(
        serializeValueCss(entry.$type, value as TokenTypeMap[typeof entry.$type]),
      ),
      derived: false,
    });
  }

  return lines;
}

function generateThemesSource(config: GeneratorContext, keys: Map<string, string>): string {
  const themeNames = Object.keys(config.themes).sort();
  if (themeNames.length === 0) {
    return "export {};\n";
  }

  const lines = [
    'import * as stylex from "@stylexjs/stylex";',
    'import { vars } from "./tokens.stylex.js";',
    "",
  ];

  for (const themeName of themeNames) {
    const override = config.themes[themeName]!;
    const tokenLines = themeOverrideLines(config, keys, override);
    lines.push(
      `export const ${themeName}Theme = stylex.createTheme(vars, ${formatVarLines(tokenLines)});`,
      "",
    );
  }

  return lines.join("\n");
}

/**
 * A scale export is a plain object literal mapping each scale key to
 * `vars.<flatKey>`. Composite scale types (typography/transition) expand
 * into multiple flat vars with no single combined reference, so only their
 * union type is exported — consumers switch on the key and read the
 * per-property vars directly (see the plan's "ergonomic consequences").
 */
function generateScaleSource(keys: Map<string, string>, scale: ScaleExport): string {
  const type = scale.metadata.keys
    .map((key) => (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(key) ? key : JSON.stringify(key)))
    .join(" | ");
  const typeDeclaration = `export type ${scale.typeName} = ${type};`;

  if (isExpandedComposite(scale.metadata.type)) {
    return typeDeclaration;
  }

  const entries = scale.metadata.keys.map((key) => {
    const path = [...scale.metadata.path, key];
    const flat = keys.get(pathKey(path));
    if (!flat) {
      throw new Error(`Missing generated StyleX key for scale member: ${pathKey(path)}`);
    }
    const propertyKey = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(key) ? key : JSON.stringify(key);
    return `  ${propertyKey}: vars.${flat},`;
  });

  return `${typeDeclaration}\n\nexport const ${scale.exportName} = {\n${entries.join("\n")}\n} as const;`;
}

function generateScalesSource(config: GeneratorContext, keys: Map<string, string>): string {
  const scaleExports = scaleExportsForConfig(config);
  const lines = ['import { vars } from "./tokens.stylex.js";', ""];
  for (const scale of scaleExports) {
    lines.push(generateScaleSource(keys, scale), "");
  }
  return lines.join("\n");
}

function resolveTokenBindingEntry<T extends TokenType>(
  registry: GeneratorContext["registry"],
  token: TokenBinding<T>,
  expectedType: T,
  label: string,
): TokenEntry {
  if (!isStampedToken(token) || token.$type !== expectedType) {
    throw new Error(`Output "${label}" must be a ${expectedType} token.`);
  }
  const entry = registry.get(pathKey(token._path));
  if (!entry) {
    throw new Error(`Output "${label}" references a token that is not registered.`);
  }
  return entry;
}

export type StylexPluginOptions = {
  outDir: string;
  fontFamily: TokenBinding<"fontFamily">;
  placeholderColor: TokenBinding<"color">;
};

export function generateStylexFiles(
  config: GeneratorContext,
  options: StylexPluginOptions,
): OutputFile[] {
  const keys = buildKeyMap(config);

  const fontFamilyEntry = resolveTokenBindingEntry(
    config.registry,
    options.fontFamily,
    "fontFamily",
    "fontFamily",
  );
  const placeholderColorEntry = resolveTokenBindingEntry(
    config.registry,
    options.placeholderColor,
    "color",
    "placeholderColor",
  );

  const fontFamilyValue = resolveEntryValue(
    config.registry,
    fontFamilyEntry,
  ) as TokenTypeMap["fontFamily"];
  const placeholderColorValue = resolveEntryValue(
    config.registry,
    placeholderColorEntry,
  ) as TokenTypeMap["color"];
  const fontFamilyCss = serializeValueCss("fontFamily", fontFamilyValue);
  const placeholderColorCss = serializeValueCss("color", placeholderColorValue);

  return [
    { filename: "tokens.stylex.ts", content: generateVarsSource(config, keys) },
    {
      filename: "reset.gen.css",
      content: generateCssResetStylesheet({
        fontFamily: fontFamilyCss,
        placeholderColor: placeholderColorCss,
      }),
    },
    { filename: "themes.ts", content: generateThemesSource(config, keys) },
    { filename: "scales.ts", content: generateScalesSource(config, keys) },
  ];
}
