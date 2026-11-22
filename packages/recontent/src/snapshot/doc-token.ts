import { expandedMembers, isCompositeType } from "../token-model/composite.js";
import { pathKey } from "../token-model/guards.js";
import {
  type ThemeOverride,
  type TokenEntry,
  type TokenRegistry,
} from "../token-model/registry.js";
import { type TokenLayer } from "../token-model/model.js";
import {
  type GradientValue,
  type StrokeStyleValue,
  type TokenMember,
  type TokenType,
  type TokenTypeMap,
} from "../token-model/values.js";
import {
  cssVarName,
  serializeCompositeCss,
  serializeValueCss,
  type GradientResolver,
} from "../serialize/values.js";
import type { GeneratorContext } from "../plugins/shared/context.js";
import { getEntry, resolveEntryValue } from "../token-model/alias.js";

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

function formatStrokeStyle(value: StrokeStyleValue): string {
  if ("style" in value) return value.style;
  const dashes = value.dashArray.map((dash) => memberText("dimension", dash)).join(" ");
  return `dashed (${dashes}; line-cap: ${value.lineCap})`;
}

function valueText(
  type: TokenType,
  value: TokenEntry["$value"],
  registry: TokenRegistry,
  override?: ThemeOverride,
): string {
  const resolveGradient: GradientResolver = (member) =>
    member.alias
      ? (resolveEntryValue(registry, getEntry(registry, member.alias), override) as GradientValue)
      : (member.$value as GradientValue);
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
        resolveGradient,
      );
    case "strokeStyle":
      return formatStrokeStyle(value as StrokeStyleValue);
    default:
      return serializeValueCss(type, value as never);
  }
}

export function buildToken(ctx: GeneratorContext, entry: TokenEntry, themes: string[]): DocToken {
  const key = pathKey(entry.path);
  const defaultValue = valueText(entry.$type, resolveEntryValue(ctx.registry, entry), ctx.registry);
  const values: Record<string, string> = { default: defaultValue };
  const composite = isCompositeType(entry.$type);
  for (const theme of themes) {
    const override = ctx.themes[theme];
    if (!entry.alias && !composite && !override?.has(key)) continue;
    const themed = valueText(
      entry.$type,
      resolveEntryValue(ctx.registry, entry, override),
      ctx.registry,
      override,
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
