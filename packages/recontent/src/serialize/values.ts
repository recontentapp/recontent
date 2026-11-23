import type {
  BorderValue,
  GradientValue,
  ShadowLayer,
  ShadowValue,
  TokenMember,
  TokenType,
  TokenTypeMap,
  TransitionValue,
  TypographyValue,
} from "../token-model/values.js";
import type { TokenEntry } from "../token-model/registry.js";
import { FONT_WEIGHT_NUMERIC } from "../token-model/values.js";
import { roundTo } from "./native.js";

function serializeColorDtcg(value: TokenTypeMap["color"]): TokenTypeMap["color"] {
  return value;
}

export function serializeColorCss(value: TokenTypeMap["color"]): string {
  if (value.colorSpace === "srgb") {
    if (value.alpha < 1) {
      const alphaByteHex = Math.round(value.alpha * 255)
        .toString(16)
        .padStart(2, "0");
      return `${value.hex}${alphaByteHex}`;
    }
    return value.hex;
  }
  const [a, b, c] = value.components;
  const alpha = value.alpha < 1 ? ` / ${value.alpha}` : "";
  switch (value.colorSpace) {
    // These spaces have dedicated CSS functions; `color()` only accepts predefined spaces.
    case "oklch":
    case "oklab":
    case "lab":
    case "lch":
      return `${value.colorSpace}(${a} ${b} ${c}${alpha})`;
    case "hsl":
    case "hwb":
      return `${value.colorSpace}(${a} ${percent(b)} ${percent(c)}${alpha})`;
    default:
      return `color(${value.colorSpace} ${a} ${b} ${c}${alpha})`;
  }
}

function percent(component: number | "none"): string {
  return component === "none" ? component : `${component}%`;
}

export function serializeFontWeight(value: TokenTypeMap["fontWeight"]): number {
  if (typeof value.value === "number") {
    return value.value;
  }
  return FONT_WEIGHT_NUMERIC[value.value];
}

function serializeStrokeStyleDtcg(value: TokenTypeMap["strokeStyle"]): unknown {
  if ("style" in value) {
    return value.style;
  }
  return {
    dashArray: value.dashArray.map((member) => serializeMemberDtcg("dimension", member)),
    lineCap: value.lineCap,
  };
}

// DTCG only defines `px` and `rem` for dimensions, so `em` is emitted as `rem` with the same value (the dtcg plugin warns about it).
function serializeDimensionDtcg(value: TokenTypeMap["dimension"]): TokenTypeMap["dimension"] {
  return value.unit === "em" ? { value: value.value, unit: "rem" } : value;
}

function serializeStrokeStyleCss(value: TokenTypeMap["strokeStyle"]): string {
  if ("style" in value) {
    return value.style;
  }
  return "dashed";
}

function serializeCompositeDtcg(type: TokenType, value: unknown): unknown {
  switch (type) {
    case "shadow": {
      const shadow = value as ShadowValue;
      const layerNode = (layer: ShadowLayer | TokenMember<"shadow">) => {
        if (!("color" in layer)) {
          return serializeMemberDtcg("shadow", layer);
        }
        return {
          color: serializeMemberDtcg("color", layer.color),
          offsetX: serializeMemberDtcg("dimension", layer.offsetX),
          offsetY: serializeMemberDtcg("dimension", layer.offsetY),
          blur: serializeMemberDtcg("dimension", layer.blur),
          spread: serializeMemberDtcg("dimension", layer.spread),
          ...(layer.inset ? { inset: true } : {}),
        };
      };
      return shadow.layers.length === 1
        ? layerNode(shadow.layers[0]!)
        : shadow.layers.map(layerNode);
    }
    case "border": {
      const border = value as BorderValue;
      return {
        color: serializeMemberDtcg("color", border.color),
        width: serializeMemberDtcg("dimension", border.width),
        style: serializeMemberDtcg("strokeStyle", border.style),
      };
    }
    case "transition": {
      const transition = value as TransitionValue;
      return {
        duration: serializeMemberDtcg("duration", transition.duration),
        delay: serializeMemberDtcg("duration", transition.delay),
        timingFunction: serializeMemberDtcg("cubicBezier", transition.timingFunction),
      };
    }
    case "gradient": {
      const gradient = value as GradientValue;
      return gradient.stops.map((stop) => {
        if (!("color" in stop)) {
          return serializeMemberDtcg("gradient", stop);
        }
        return {
          color: serializeMemberDtcg("color", stop.color),
          position: serializeMemberDtcg("number", stop.position),
        };
      });
    }
    case "typography": {
      const typography = value as TypographyValue;
      return {
        fontFamily: serializeMemberDtcg("fontFamily", typography.fontFamily),
        fontSize: serializeMemberDtcg("dimension", typography.fontSize),
        fontWeight: serializeMemberDtcg("fontWeight", typography.fontWeight),
        letterSpacing: serializeMemberDtcg("dimension", typography.letterSpacing),
        lineHeight: serializeMemberDtcg("number", typography.lineHeight),
      };
    }
    default:
      throw new Error(`Unknown composite token type: ${type}`);
  }
}

export function serializeValueDtcg<T extends TokenType>(type: T, value: TokenTypeMap[T]): unknown {
  switch (type) {
    case "color":
      return serializeColorDtcg(value as TokenTypeMap["color"]);
    case "dimension":
      return serializeDimensionDtcg(value as TokenTypeMap["dimension"]);
    case "fontFamily":
      return (value as TokenTypeMap["fontFamily"]).value;
    case "fontWeight":
      return serializeFontWeight(value as TokenTypeMap["fontWeight"]);
    case "duration":
      return value as TokenTypeMap["duration"];
    case "cubicBezier":
      return (value as TokenTypeMap["cubicBezier"]).value;
    case "number":
      return (value as TokenTypeMap["number"]).value;
    case "strokeStyle":
      return serializeStrokeStyleDtcg(value as TokenTypeMap["strokeStyle"]);
    case "shadow":
    case "border":
    case "transition":
    case "gradient":
    case "typography":
      return serializeCompositeDtcg(type, value);
    default:
      throw new Error(`Unknown token type: ${type satisfies never}`);
  }
}

function serializeMemberDtcg<T extends TokenType>(type: T, member: TokenMember<T>): unknown {
  return member.alias ? dtcgAliasReference(member.alias) : serializeValueDtcg(type, member.$value);
}

export type MemberResolver = (type: TokenType, member: TokenMember) => string;
export type GradientResolver = (member: TokenMember<"gradient">) => GradientValue;

const GENERIC_FONT_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
]);

const CSS_WIDE_KEYWORDS = new Set([
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  "default",
]);

function formatFontFamilyCss(family: string): string {
  const lower = family.toLowerCase();
  if (GENERIC_FONT_FAMILIES.has(lower)) return family;
  // Unquoted CSS <family-name> consists of <custom-ident> tokens (no dots, leading digits, or CSS-wide keywords).
  const isUnquotedSafe =
    !CSS_WIDE_KEYWORDS.has(lower) &&
    family
      .split(/\s+/)
      .every((part) => /^[A-Za-z_\u00A0-\uFFFF][A-Za-z0-9_\u00A0-\uFFFF-]*$/.test(part));
  return isUnquotedSafe ? family : JSON.stringify(family);
}

function flattenGradientStops(
  stops: GradientValue["stops"],
  resolveGradient?: GradientResolver,
  visited: Set<string | GradientValue> = new Set(),
): Array<{ color: TokenMember<"color">; position: TokenMember<"number"> }> {
  const result: Array<{ color: TokenMember<"color">; position: TokenMember<"number"> }> = [];
  for (const stop of stops) {
    if ("color" in stop) {
      result.push(stop);
      continue;
    }
    const nested = resolveGradient ? resolveGradient(stop) : (stop.$value as GradientValue);
    const visitKey = stop.alias ? stop.alias.join(".") : nested;
    if (visited.has(visitKey)) {
      throw new Error("Circular gradient alias detected.");
    }
    visited.add(visitKey);
    try {
      result.push(...flattenGradientStops(nested.stops, resolveGradient, visited));
    } finally {
      visited.delete(visitKey);
    }
  }
  return result;
}

function resolvePositionPercent(resolve: MemberResolver, position: TokenMember<"number">): string {
  if (position.alias) {
    return `calc(${resolve("number", position)} * 100%)`;
  }
  return `${roundTo(position.$value.value * 100, 4)}%`;
}

export function serializeCompositeCss(
  type: "shadow" | "border" | "gradient",
  value: TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
  resolve: MemberResolver,
  resolveGradient?: GradientResolver,
): string {
  switch (type) {
    case "shadow": {
      const shadow = value as ShadowValue;
      return shadow.layers
        .map((layer) => {
          if (!("color" in layer)) {
            return resolve("shadow", layer);
          }
          const inset = layer.inset ? "inset " : "";
          return `${inset}${resolve("dimension", layer.offsetX)} ${resolve("dimension", layer.offsetY)} ${resolve("dimension", layer.blur)} ${resolve("dimension", layer.spread)} ${resolve("color", layer.color)}`;
        })
        .join(", ");
    }
    case "border": {
      const border = value as BorderValue;
      return `${resolve("dimension", border.width)} ${resolve("strokeStyle", border.style)} ${resolve("color", border.color)}`;
    }
    case "gradient": {
      const gradient = value as GradientValue;
      const stops = flattenGradientStops(gradient.stops, resolveGradient)
        .map(
          (stop) =>
            `${resolve("color", stop.color)} ${resolvePositionPercent(resolve, stop.position)}`,
        )
        .join(", ");
      if (gradient.kind === "radial") {
        return `radial-gradient(${stops})`;
      }
      if (gradient.kind === "conic") {
        return `conic-gradient(from ${gradient.angle}, ${stops})`;
      }
      return `linear-gradient(${gradient.angle}, ${stops})`;
    }
    default:
      throw new Error(`Unknown inline composite token type: ${type satisfies never}`);
  }
}

/** `prefix` is the one of the CSS variables the value may reference through its aliased members. */
export function serializeValueCss<T extends TokenType>(
  type: T,
  value: TokenTypeMap[T],
  prefix?: string,
  resolveGradient?: GradientResolver,
): string {
  switch (type) {
    case "color":
      return serializeColorCss(value as TokenTypeMap["color"]);
    case "dimension": {
      const v = value as TokenTypeMap["dimension"];
      return `${v.value}${v.unit}`;
    }
    case "fontFamily":
      return (value as TokenTypeMap["fontFamily"]).value.map(formatFontFamilyCss).join(", ");
    case "fontWeight":
      return String(serializeFontWeight(value as TokenTypeMap["fontWeight"]));
    case "duration": {
      const v = value as TokenTypeMap["duration"];
      return `${v.value}${v.unit}`;
    }
    case "cubicBezier": {
      const v = (value as TokenTypeMap["cubicBezier"]).value;
      return `cubic-bezier(${v.join(", ")})`;
    }
    case "number":
      return String((value as TokenTypeMap["number"]).value);
    case "strokeStyle":
      return serializeStrokeStyleCss(value as TokenTypeMap["strokeStyle"]);
    case "shadow":
    case "border":
    case "gradient": {
      const resolve: MemberResolver = (memberType, member) =>
        member.alias
          ? `var(${cssVarName(member.alias, prefix)})`
          : serializeValueCss(memberType, member.$value, prefix, resolveGradient);
      return serializeCompositeCss(
        type as "shadow" | "border" | "gradient",
        value as TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
        resolve,
        resolveGradient,
      );
    }
    case "typography":
    case "transition":
      throw new Error(
        `serializeValueCss cannot render a single CSS value for "${type}"; use expandedMembers(...) to emit its sub-variables instead.`,
      );
    default:
      throw new Error(`Unknown token type: ${type satisfies never}`);
  }
}

function escapeCssIdentSegment(segment: string): string {
  return segment.replace(/[^A-Za-z0-9_-]/g, (ch) => `\\${ch}`);
}

export function cssVarName(path: string[], prefix?: string): string {
  const escaped = path.map(escapeCssIdentSegment);
  return `--${prefix ? `${prefix}-` : ""}${escaped.join("-")}`;
}

function dtcgAliasReference(path: string[]): string {
  return `{${path.join(".")}}`;
}

export function setNested(target: Record<string, unknown>, path: string[], value: unknown): void {
  if (path.length === 0) {
    throw new Error("Cannot set a nested value without a path.");
  }
  let current = target;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]!;
    if (!Object.hasOwn(current, segment)) {
      current[segment] = Object.create(null) as Record<string, unknown>;
    }
    current = current[segment] as Record<string, unknown>;
  }
  current[path[path.length - 1]!] = value;
}

function metadataFields(entry: TokenEntry): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (entry.$description !== undefined) {
    fields.$description = entry.$description;
  }
  if (entry.$deprecated !== undefined) {
    fields.$deprecated = entry.$deprecated;
  }
  return fields;
}

export function entryToDtcgNode(entry: TokenEntry): Record<string, unknown> {
  if (entry.alias) {
    return {
      $type: entry.$type,
      $value: dtcgAliasReference(entry.alias),
      ...metadataFields(entry),
      ...(entry.$extensions ? { $extensions: entry.$extensions } : {}),
    };
  }

  const node: Record<string, unknown> = {
    $type: entry.$type,
    $value: serializeValueDtcg(entry.$type, entry.$value),
    ...metadataFields(entry),
  };

  const comRecontent: Record<string, unknown> = {};
  if (entry.$type === "gradient") {
    const gradient = entry.$value as TokenTypeMap["gradient"];
    Object.assign(comRecontent, { kind: gradient.kind, angle: gradient.angle });
  }
  const userComRecontent = entry.$extensions?.["com.recontent"];
  if (
    userComRecontent &&
    typeof userComRecontent === "object" &&
    !Array.isArray(userComRecontent)
  ) {
    Object.assign(comRecontent, userComRecontent);
  }

  const extensions: Record<string, unknown> = { ...entry.$extensions };
  if (Object.keys(comRecontent).length > 0) {
    extensions["com.recontent"] = comRecontent;
  }
  if (Object.keys(extensions).length > 0) {
    node.$extensions = extensions;
  }

  return node;
}
