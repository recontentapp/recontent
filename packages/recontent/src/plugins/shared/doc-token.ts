import {
  expandedMembers,
  pathKey,
  type TokenEntry,
  type TokenLayer,
  type TokenMember,
  type TokenType,
  type TokenTypeMap,
} from "@recontentapp/core";
import { cssVarName, serializeCompositeCss, serializeValueCss } from "../../serialize/values.js";
import type { GeneratorContext } from "./context.js";
import { resolveEntryValue } from "./ts-source.js";

export type DocToken = {
  layer: TokenLayer;
  path: string;
  name: string;
  type: TokenType;
  alias?: string;
  description?: string;
  deprecated?: true | string;
  cssVar: string;
  /** `default` plus one entry per theme whose value differs from the default. */
  values: Record<string, string>;
};

export function deprecation(value: boolean | string | undefined): true | string | undefined {
  if (value === undefined || value === false) return undefined;
  return value === true || value === "" ? true : value;
}

function memberText(type: TokenType, member: TokenMember): string {
  return member.alias ? pathKey(member.alias) : serializeValueCss(type, member.$value);
}

function valueText(type: TokenType, value: TokenEntry["$value"]): string {
  switch (type) {
    case "typography":
    case "transition":
      return expandedMembers(
        type as "typography" | "transition",
        value as TokenTypeMap["typography"] | TokenTypeMap["transition"],
      )
        .map(({ cssProperty, type: memberType, member }) => {
          return `${cssProperty}: ${memberText(memberType, member)}`;
        })
        .join(", ");
    case "shadow":
    case "border":
    case "gradient":
      return serializeCompositeCss(
        type,
        value as TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
        memberText,
      );
    default:
      return serializeValueCss(type, value as never);
  }
}

export function buildToken(ctx: GeneratorContext, entry: TokenEntry, themes: string[]): DocToken {
  const defaultValue = valueText(entry.$type, resolveEntryValue(ctx.registry, entry));
  const values: Record<string, string> = { default: defaultValue };
  for (const theme of themes) {
    const themed = valueText(
      entry.$type,
      resolveEntryValue(ctx.registry, entry, ctx.themes[theme]),
    );
    if (themed !== defaultValue) values[theme] = themed;
  }

  const deprecated = deprecation(entry.$deprecated);
  return {
    layer: entry.layer,
    path: pathKey(entry.path),
    name: entry.path[entry.path.length - 1] ?? "",
    type: entry.$type,
    ...(entry.alias ? { alias: pathKey(entry.alias) } : {}),
    ...(entry.$description !== undefined ? { description: entry.$description } : {}),
    ...(deprecated !== undefined ? { deprecated } : {}),
    cssVar: cssVarName(entry.path),
    values,
  };
}
