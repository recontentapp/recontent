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
import type { GeneratorContext } from "../shared/context.js";
import { resolveEntryValue } from "../shared/ts-source.js";

const DOC_LAYERS: TokenLayer[] = ["ref", "system", "components"];

export type DocToken = {
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

export type DocGroup = {
  path: string;
  label: string;
  scale?: { description?: string; deprecated?: true | string };
  tokens: DocToken[];
};

type DocLayer = { layer: TokenLayer; groups: DocGroup[] };

export type DocsModel = {
  title: string;
  themes: string[];
  tokenCount: number;
  layers: DocLayer[];
};

const numericCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

function deprecation(value: boolean | string | undefined): true | string | undefined {
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

function buildToken(ctx: GeneratorContext, entry: TokenEntry, themes: string[]): DocToken {
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

export function buildDocsModel(ctx: GeneratorContext, title: string): DocsModel {
  const themes = Object.keys(ctx.themes);
  const entries = [...ctx.registry.values()].sort((a, b) =>
    numericCompare(pathKey(a.path), pathKey(b.path)),
  );

  const layers: DocLayer[] = DOC_LAYERS.map((layer) => {
    const groups = new Map<string, DocGroup>();
    for (const entry of entries) {
      if (entry.layer !== layer) continue;
      const groupPath = pathKey(entry.path.slice(0, -1));
      let group = groups.get(groupPath);
      if (!group) {
        group = { path: groupPath, label: groupPath || layer, tokens: [] };
        groups.set(groupPath, group);
      }
      if (entry.scale && !group.scale) {
        const deprecated = deprecation(entry.scale.$deprecated);
        group.scale = {
          ...(entry.scale.$description !== undefined
            ? { description: entry.scale.$description }
            : {}),
          ...(deprecated !== undefined ? { deprecated } : {}),
        };
      }
      group.tokens.push(buildToken(ctx, entry, themes));
    }
    return { layer, groups: [...groups.values()] };
  });

  return { title, themes, tokenCount: ctx.registry.size, layers };
}
