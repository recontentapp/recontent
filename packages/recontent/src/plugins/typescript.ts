import {
  expandedMembers,
  isExpandedComposite,
  type OutputFile,
  type RecontentPlugin,
  type TokenEntry,
  type TokenMember,
  type TokenType,
  type TokenTypeMap,
} from "@recontentapp/core";
import { createLogger } from "../logger.js";
import {
  serializeCompositeCss,
  serializeFontWeight,
  serializeValueCss,
  type MemberResolver,
} from "../serialize/values.js";
import {
  escapeTemplateLiteral,
  generateScaleExports,
  scaleExportsForConfig,
} from "./shared/ts-source.js";
import {
  generateThemeSource,
  type MemberLookup,
  type ThemeTargetSpec,
} from "./shared/theme-source.js";
import type { SourceTree, SourceValue } from "./shared/ts-source.js";
import type { GeneratorContext } from "./shared/context.js";
import { outputPlugin } from "./factory.js";

function scalarSourceValue(type: TokenType, value: TokenTypeMap[TokenType]): SourceValue {
  switch (type) {
    case "fontWeight":
      return {
        value: String(serializeFontWeight(value as TokenTypeMap["fontWeight"])),
        source: true,
      };
    case "number":
      return { value: String((value as TokenTypeMap["number"]).value), source: true };
    case "color":
    case "dimension":
    case "duration":
    case "cubicBezier":
    case "fontFamily":
    case "strokeStyle":
      return { value: serializeValueCss(type, value as never) };
    default:
      throw new Error(`The "typescript" output target cannot serialize scalar type "${type}".`);
  }
}

function memberSourceValue(
  type: TokenType,
  member: TokenMember,
  lookup: MemberLookup,
): SourceValue {
  if (!member.alias) {
    return scalarSourceValue(type, member.$value);
  }
  const resolved = lookup(member.alias);
  return resolved.ref !== undefined
    ? { value: resolved.ref, source: true }
    : scalarSourceValue(type, resolved.value);
}

function inlineComposite(
  type: "shadow" | "border" | "gradient",
  value: TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
  lookup: MemberLookup,
): SourceValue {
  const resolve: MemberResolver = (memberType, member) => {
    if (!member.alias) {
      return escapeTemplateLiteral(serializeValueCss(memberType, member.$value));
    }
    const resolved = lookup(member.alias);
    if (resolved.ref !== undefined) {
      return `\${${resolved.ref}}`;
    }
    return escapeTemplateLiteral(serializeValueCss(memberType, resolved.value));
  };
  const template = serializeCompositeCss(type, value, resolve);
  return { value: `\`${template}\``, source: true };
}

function expandedComposite(
  type: "typography" | "transition",
  value: TokenTypeMap["typography"] | TokenTypeMap["transition"],
  lookup: MemberLookup,
): SourceTree {
  const tree: SourceTree = {};
  for (const { cssProperty, type: memberType, member } of expandedMembers(type, value)) {
    tree[cssProperty] = memberSourceValue(memberType, member, lookup);
  }
  return tree;
}

const webSpec: ThemeTargetSpec = {
  scalar(type, value): SourceValue {
    return scalarSourceValue(type, value);
  },
  composite(entry: TokenEntry, resolved, member): SourceValue | SourceTree {
    if (isExpandedComposite(entry.$type)) {
      return expandedComposite(
        entry.$type,
        resolved as TokenTypeMap["typography"] | TokenTypeMap["transition"],
        member,
      );
    }
    return inlineComposite(
      entry.$type as "shadow" | "border" | "gradient",
      resolved as TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
      member,
    );
  },
};

function generateTypeScriptSource(config: GeneratorContext): string {
  const logger = config.logger ?? createLogger();
  const body = generateThemeSource(config, webSpec, logger, "typescript");
  const scaleExports = scaleExportsForConfig(config);
  const themeConstNames = ["theme", ...Object.keys(config.themes).sort()];

  const lines = [body];

  for (const scale of scaleExports) {
    lines.push(`${generateScaleExports(scale, "theme")}\n`);
  }

  lines.push(
    `export const themes = { ${themeConstNames.join(", ")} } as const;`,
    "export type ThemeName = keyof typeof themes;",
    "export type Theme = (typeof themes)[ThemeName];",
    "export type BaseTheme = typeof theme;",
  );

  return `${lines.join("\n")}\n`;
}

export type TypeScriptPluginOptions = {
  outDir: string;
};

export function generateTypeScriptFiles(
  config: GeneratorContext,
  _options: TypeScriptPluginOptions,
): OutputFile[] {
  return [{ filename: "tokens.ts", content: generateTypeScriptSource(config) }];
}

export function typescript(options: TypeScriptPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:typescript", options, generateTypeScriptFiles);
}
