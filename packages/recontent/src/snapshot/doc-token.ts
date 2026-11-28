import { compositeMembers, expandedMembers, isCompositeType } from "../token-model/composite.js";
import { pathKey } from "../token-model/guards.js";
import {
  type ThemeAxis,
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
import {
  getEntry,
  resolveEntryValue,
  themeCombinations,
  themedEntry,
  type ThemeCombination,
} from "../token-model/alias.js";
import type { SnapshotThemeAxis } from "./snapshot.js";

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

function relevantAxesForToken(
  entry: TokenEntry,
  registry: TokenRegistry,
  axes: readonly ThemeAxis[],
): ThemeAxis[] {
  const visited = new Set<string>([pathKey(entry.path)]);
  const queue = [pathKey(entry.path)];

  while (queue.length > 0) {
    const key = queue.shift()!;
    const regEntry = registry.get(key);
    if (!regEntry) continue;

    const views = [regEntry];
    for (const axis of axes) {
      for (const ov of Object.values(axis.contexts)) {
        if (ov.has(key)) views.push(themedEntry(regEntry, ov));
      }
    }

    for (const view of views) {
      const targets: string[] = [];
      if (view.alias) targets.push(pathKey(view.alias));
      if (isCompositeType(view.$type)) {
        for (const { member } of compositeMembers(
          view.$type,
          view.$value as TokenTypeMap[typeof view.$type],
        )) {
          if (member.alias) targets.push(pathKey(member.alias));
        }
      } else if (view.$type === "strokeStyle") {
        const stroke = view.$value as StrokeStyleValue;
        if ("dashArray" in stroke) {
          for (const dash of stroke.dashArray) {
            if (dash.alias) targets.push(pathKey(dash.alias));
          }
        }
      }
      for (const target of targets) {
        if (!visited.has(target)) {
          visited.add(target);
          queue.push(target);
        }
      }
    }
  }

  const relevant: ThemeAxis[] = [];
  for (const axis of axes) {
    const matchingContexts: Record<string, ThemeOverride> = {};
    let hasMatch = false;
    for (const [contextName, ov] of Object.entries(axis.contexts)) {
      for (const k of visited) {
        if (ov.has(k)) {
          matchingContexts[contextName] = ov;
          hasMatch = true;
          break;
        }
      }
    }
    if (hasMatch) {
      relevant.push({
        name: axis.name,
        default: axis.default,
        ...(axis.description !== undefined ? { description: axis.description } : {}),
        contexts: matchingContexts,
      });
    }
  }
  return relevant;
}

const combinationCache = new WeakMap<readonly ThemeAxis[], Map<string, ThemeCombination[]>>();

function cachedCombinations(
  allAxes: readonly ThemeAxis[],
  subset: readonly ThemeAxis[],
): ThemeCombination[] {
  let byKey = combinationCache.get(allAxes);
  if (!byKey) {
    byKey = new Map();
    combinationCache.set(allAxes, byKey);
  }
  const cacheKey = subset
    .map((axis) => `${axis.name}:${Object.keys(axis.contexts).join(",")}`)
    .join("|");
  let combos = byKey.get(cacheKey);
  if (!combos) {
    combos = themeCombinations(subset);
    byKey.set(cacheKey, combos);
  }
  return combos;
}

export function resolveDocTokenValue(
  token: DocToken,
  axes: readonly SnapshotThemeAxis[],
  selection: Record<string, string>,
): { value: string; overridden: boolean } {
  const defaultValue = token.values.default ?? "";
  if (axes.length === 0) {
    return { value: defaultValue, overridden: false };
  }
  if (axes.length === 1) {
    const axis = axes[0]!;
    const ctxName = selection[axis.name];
    if (!ctxName || ctxName === axis.default) {
      return { value: defaultValue, overridden: false };
    }
    const val = token.values[ctxName];
    return val !== undefined
      ? { value: val, overridden: val !== defaultValue }
      : { value: defaultValue, overridden: false };
  }

  const valueKeyParts = Object.keys(token.values).map((k) => k.split(","));
  const relevantActive: string[] = [];
  for (const axis of axes) {
    const ctxName = selection[axis.name];
    if (!ctxName || ctxName === axis.default) continue;
    const pair = `${axis.name}=${ctxName}`;
    const touchesPair = valueKeyParts.some((parts) => parts.includes(pair));
    if (touchesPair) {
      relevantActive.push(pair);
    }
  }

  if (relevantActive.length === 0) {
    return { value: defaultValue, overridden: false };
  }

  const exactKey = relevantActive.join(",");
  if (token.values[exactKey] !== undefined) {
    const val = token.values[exactKey]!;
    return { value: val, overridden: val !== defaultValue };
  }

  let current = defaultValue;
  for (const pair of relevantActive) {
    if (token.values[pair] !== undefined) {
      current = token.values[pair]!;
    }
  }
  return { value: current, overridden: current !== defaultValue };
}

export function buildToken(ctx: GeneratorContext, entry: TokenEntry): DocToken {
  const key = pathKey(entry.path);
  const defaultValue = valueText(entry.$type, resolveEntryValue(ctx.registry, entry), ctx.registry);
  const values: Record<string, string> = { default: defaultValue };
  const composite = isCompositeType(entry.$type);

  if (ctx.themes.length === 1) {
    const axis = ctx.themes[0]!;
    for (const [contextName, override] of Object.entries(axis.contexts)) {
      if (!entry.alias && !composite && !override.has(key)) continue;
      const themed = valueText(
        entry.$type,
        resolveEntryValue(ctx.registry, entry, override),
        ctx.registry,
        override,
      );
      if (themed !== defaultValue) values[contextName] = themed;
    }
  } else if (ctx.themes.length > 1) {
    const relevantAxes = relevantAxesForToken(entry, ctx.registry, ctx.themes);
    for (const axis of relevantAxes) {
      for (const [contextName, override] of Object.entries(axis.contexts)) {
        if (!entry.alias && !composite && !override.has(key)) continue;
        const themed = valueText(
          entry.$type,
          resolveEntryValue(ctx.registry, entry, override),
          ctx.registry,
          override,
        );
        if (themed !== defaultValue) values[`${axis.name}=${contextName}`] = themed;
      }
    }

    if (relevantAxes.length >= 2) {
      for (const combo of cachedCombinations(ctx.themes, relevantAxes)) {
        if (!combo.override) continue;
        const activePairs = relevantAxes
          .filter((axis) => combo.selection[axis.name] !== axis.default)
          .map((axis) => `${axis.name}=${combo.selection[axis.name]}`);
        if (activePairs.length < 2) continue;

        let predicted = defaultValue;
        for (const pair of activePairs) {
          if (values[pair] !== undefined) predicted = values[pair]!;
        }

        const actual = valueText(
          entry.$type,
          resolveEntryValue(ctx.registry, entry, combo.override),
          ctx.registry,
          combo.override,
        );
        if (actual !== predicted) {
          values[activePairs.join(",")] = actual;
        }
      }
    }
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
