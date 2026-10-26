/**
 * StyleX cannot reference a var from a different `defineVars` group, so all
 * three token layers live in ONE `defineVars` call with flat, layer-prefixed
 * keys. Aliases are preserved as derived functions
 * (`key: () => \`${vars.target}\``), which StyleX resolves through
 * arbitrarily long chains. `createTheme` overrides, by contrast, only ever
 * compile to CSS when given a *literal* value — a derived-function override
 * value silently produces no CSS rule (verified empirically against
 * @stylexjs/babel-plugin 0.19.0) — so every theme override below is
 * flattened to a literal via `serializeValueCss`/`member.$value`, never
 * re-aliased. This is safe: CSS custom-property cascade means overriding a
 * single upstream var (e.g. a ref color) already propagates to every token
 * that aliases it, without needing to redeclare the intermediate keys.
 */
import {
  compositeMembers,
  expandedMembers,
  isCompositeType,
  isExpandedComposite,
  isStampedToken,
  pathKey,
  type OutputFile,
  type RecontentPlugin,
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
import { CircularAliasError, getEntry, terminalEntry } from "./shared/alias.js";
import type { GeneratorContext } from "./shared/context.js";
import { resetRules, type CssResetOptions } from "./shared/reset.js";
import { validateThemeNames } from "./shared/theme-source.js";
import {
  capitalize,
  escapeString,
  entryPath,
  escapeTemplateLiteral,
  quotedKey,
  resolveEntryValue,
  scaleExportsForConfig,
  type ScaleExport,
} from "./shared/ts-source.js";
import type { TokenBinding } from "@recontentapp/core";
import { outputPlugin } from "./factory.js";

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9]/g, "");
}

function capitalizeSegment(segment: string): string {
  return capitalize(sanitizeSegment(segment));
}

/**
 * Flattens a token path into a single camelCase identifier, since StyleX's
 * `defineVars` rejects nested objects: `["ref", "color", "gray900"]` becomes
 * `refColorGray900`; `["ref", "spacing", "0-5"]` becomes `refSpacing05`.
 */
function flatKey(path: readonly string[]): string {
  const [first, ...rest] = path;
  const firstSanitized = sanitizeSegment(first ?? "");
  const firstKey = firstSanitized.charAt(0).toLowerCase() + firstSanitized.slice(1);
  return firstKey + rest.map(capitalizeSegment).join("");
}

/**
 * Maps every token identity to its flattened StyleX key up front.
 *
 * Plain entries are keyed by `pathKey(entry.path)`. Expanded composites
 * (`typography`, `transition`) additionally register one key per
 * `cssProperty`, keyed by `"<pathKey>.<cssProperty>"`, since each member
 * becomes its own flat `defineVars` key.
 *
 * Throws on collision: two distinct token identities flattening to the same
 * JS identifier is a naming conflict that must be fixed at the source, since
 * the generated keys are effectively public API for consumers.
 */
function buildKeyMap(config: GeneratorContext): Map<string, string> {
  const keys = new Map<string, string>();
  const owners = new Map<string, string>();

  function register(id: string, path: readonly string[]): void {
    const key = flatKey(path);
    const owner = owners.get(key);
    if (owner !== undefined && owner !== id) {
      throw new Error(
        `StyleX key collision: token paths "${owner}" and "${id}" both flatten to "${key}". ` +
          "Rename one of these tokens to avoid an ambiguous generated key.",
      );
    }
    owners.set(key, id);
    keys.set(id, key);
  }

  for (const entry of config.registry.values()) {
    const base = [entry.layer, ...entryPath(entry)];
    if (isExpandedComposite(entry.$type)) {
      const type = entry.$type as "typography" | "transition";
      for (const { cssProperty } of expandedMembers(
        type,
        entry.$value as TokenTypeMap[typeof type],
      )) {
        register(`${pathKey(entry.path)}.${cssProperty}`, [...base, cssProperty]);
      }
      continue;
    }
    register(pathKey(entry.path), base);
  }

  return keys;
}

function toKebabCase(property: string): string {
  return property.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function generateCssResetStylesheet(options: CssResetOptions): string {
  const lines: string[] = [];

  for (const rule of resetRules(options)) {
    const body = rule.declarations
      .map(({ property, value }) => `  ${toKebabCase(property)}: ${value};`)
      .join("\n");
    const block = `${rule.selector} {\n${body}\n}`;
    lines.push(rule.media ? `@media ${rule.media} {\n${block}\n}` : block);
  }

  return `${lines.join("\n\n")}\n`;
}

type VarLine = { key: string; expression: string };

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
  const current = terminalEntry(registry, entry);
  const flat = keys.get(pathKey(current.path));
  if (!flat) {
    throw new Error(`Missing generated StyleX key for token path: ${pathKey(current.path)}`);
  }
  return `vars.${flat}`;
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

  // Explicit stack rather than recursive `visit`, so alias chains far deeper
  // than the JS call stack (or a cycle, until it's caught) don't overflow it.
  type Frame = { key: string; entry: TokenEntry; deps: string[]; index: number };

  function visit(startKey: string): void {
    if (visited.has(startKey)) return;
    const startEntry = getEntry(registry, startKey);
    visiting.add(startKey);
    const stack: Frame[] = [
      { key: startKey, entry: startEntry, deps: dependencies(startEntry), index: 0 },
    ];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]!;
      if (frame.index < frame.deps.length) {
        const dependency = frame.deps[frame.index]!;
        frame.index++;
        if (visited.has(dependency)) continue;
        if (visiting.has(dependency)) {
          throw new CircularAliasError(dependency);
        }
        const dependencyEntry = getEntry(registry, dependency);
        visiting.add(dependency);
        stack.push({
          key: dependency,
          entry: dependencyEntry,
          deps: dependencies(dependencyEntry),
          index: 0,
        });
      } else {
        stack.pop();
        visiting.delete(frame.key);
        visited.add(frame.key);
        order.push(frame.entry);
      }
    }
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
  return compositeMembers(type, value)
    .filter(({ member }) => member.alias)
    .map(({ member }) => pathKey(member.alias!));
}

function expandedVarLines(
  config: GeneratorContext,
  keys: Map<string, string>,
  entry: TokenEntry,
): VarLine[] {
  const type = entry.$type as "typography" | "transition";
  const base = pathKey(entry.path);

  if (entry.alias) {
    const target = getEntry(config.registry, entry.alias);
    // Walk to the terminal (non-alias) entry sharing this composite's shape,
    // so each cssProperty references that entry's own flattened member key.
    const current = terminalEntry(config.registry, target);
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
        return { key: flat, expression: derivedTemplate(`vars.${targetFlat}`) };
      },
    );
  }

  return expandedMembers(type, entry.$value as TokenTypeMap[typeof type]).map(
    ({ cssProperty, type: memberType, member }) => {
      const flat = keys.get(`${base}.${cssProperty}`)!;
      if (member.alias) {
        const reference = resolveVariableReference(
          config.registry,
          keys,
          getEntry(config.registry, member.alias),
        );
        return { key: flat, expression: derivedTemplate(reference) };
      }
      return {
        key: flat,
        expression: quoteLiteral(serializeValueCss(memberType, member.$value)),
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
    return { key: flat, expression: derivedTemplate(reference) };
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
    return `\${${resolveVariableReference(config.registry, keys, getEntry(config.registry, member.alias))}}`;
  };
  const template = serializeCompositeCss(type, value, resolve);

  if (!hasAlias) {
    return { key: flat, expression: quoteLiteral(template) };
  }
  return { key: flat, expression: `() => \`${template}\`` };
}

function scalarVarLine(
  config: GeneratorContext,
  keys: Map<string, string>,
  entry: TokenEntry,
): VarLine {
  const flat = keys.get(pathKey(entry.path))!;
  if (entry.alias) {
    const reference = resolveVariableReference(config.registry, keys, entry);
    return { key: flat, expression: derivedTemplate(reference) };
  }
  return {
    key: flat,
    expression: quoteLiteral(serializeValueCss(entry.$type, entry.$value)),
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
      lines.push({ key: flat, expression: quoteLiteral(template) });
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
    });
  }

  return lines;
}

function generateThemesSource(config: GeneratorContext, keys: Map<string, string>): string {
  const themeNames = Object.keys(config.themes).sort();
  if (themeNames.length === 0) {
    return "export {};\n";
  }
  validateThemeNames(themeNames, "stylex");

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
 * per-property vars directly.
 */
function generateScaleSource(keys: Map<string, string>, scale: ScaleExport): string {
  const type = scale.metadata.keys.map(quotedKey).join(" | ");
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
    return `  ${quotedKey(key)}: vars.${flat},`;
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

export function stylex(options: StylexPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:stylex", ["tokens"], options, generateStylexFiles);
}
