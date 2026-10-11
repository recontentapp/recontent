import { COLOR_SPACES, componentRanges, FONT_WEIGHT_NUMERIC } from "@recontentapp/core";
import type { ColorSpace } from "@recontentapp/core";
import { escapeString } from "../../plugins/shared/ts-source.js";
import { tokens } from "../../tokens.js";
import { aliasTarget, containsJsonPointer, isObject } from "./types.js";

/** An argument or expression ready to paste into the generated config, or why there is none. */
export type Converted = { expr: string } | { skip: string };

/** Resolves an alias used as a composite member to an expression, e.g. `ref.color.red`. */
type ResolveMember = (reference: string, expectedType: string) => Converted;

const DIMENSION_UNITS = ["px", "rem", "em"];
const DURATION_UNITS = ["ms", "s"];
const STROKE_STYLES = ["solid", "dashed", "dotted", "double", "groove", "ridge", "outset", "inset"];
const LINE_CAPS = ["round", "butt", "square"];
const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const TYPOGRAPHY_KEYS = ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "lineHeight"];

const quote = (value: string): string => `'${escapeString(value)}'`;
const skip = (reason: string): Converted => ({ skip: reason });
const ok = (expr: string): Converted => ({ expr });
const describe = (value: unknown): string => JSON.stringify(value) ?? String(value);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Formats a number so it can be re-parsed by the `tokens.*` string factories (no exponent). */
function formatNumber(value: number): string {
  const text = String(value);
  return /e/i.test(text) ? value.toFixed(12).replace(/\.?0+$/, "") : text;
}

function colorArg(value: unknown): Converted {
  if (typeof value === "string") {
    return HEX_RE.test(value) ? ok(quote(value)) : skip(`unsupported color ${describe(value)}`);
  }
  if (!isObject(value)) return skip(`unsupported color ${describe(value)}`);

  const { colorSpace, components } = value;
  if (!COLOR_SPACES.includes(colorSpace as ColorSpace)) {
    return skip(`unsupported color space ${describe(colorSpace)}`);
  }
  if (
    !Array.isArray(components) ||
    components.length !== 3 ||
    !components.every((component) => component === "none" || isFiniteNumber(component))
  ) {
    return skip('color components must be three numbers or "none"');
  }
  const alpha = value.alpha === undefined ? 1 : value.alpha;
  if (!isFiniteNumber(alpha) || alpha < 0 || alpha > 1) {
    return skip(`invalid color alpha ${describe(alpha)}`);
  }

  const ranges = componentRanges(colorSpace as ColorSpace);
  for (const [index, component] of components.entries()) {
    const range = ranges[index]!;
    if (component !== "none" && (component < range.min || component > range.max)) {
      return skip(
        `color component ${index} (${component}) is outside ${range.min}..${range.max} for ${colorSpace as string}`,
      );
    }
  }

  // A hex string is only exact when every component is a whole byte; `hex` itself is
  // ignored because it may be rounded.
  const bytes = (components as Array<number | "none">).map((component) =>
    typeof component === "number" ? Math.round(component * 255) : undefined,
  );
  if (
    colorSpace === "srgb" &&
    bytes.every(
      (byte, index) =>
        byte !== undefined && Math.abs((components[index] as number) * 255 - byte) < 1e-6,
    )
  ) {
    const hex = bytes.map((byte) => byte!.toString(16).padStart(2, "0")).join("");
    if (alpha === 1) return ok(quote(`#${hex}`));
    const alphaByte = Math.round(alpha * 255);
    if (Math.abs(alphaByte / 255 - alpha) < 1e-6) {
      return ok(quote(`#${hex}${alphaByte.toString(16).padStart(2, "0")}`));
    }
  }
  const alphaSource = alpha === 1 ? "" : `, alpha: ${alpha}`;
  return ok(
    `{ colorSpace: ${quote(colorSpace as string)}, components: [${components.map((component) => JSON.stringify(component)).join(", ")}]${alphaSource} }`,
  );
}

function unitArg(value: unknown, units: string[], kind: "dimension" | "duration"): Converted {
  if (typeof value === "string") {
    const match = /^(-?\d*\.?\d+)([a-z]*)$/.exec(value.trim());
    return match && units.includes(match[2]!)
      ? ok(quote(value.trim()))
      : skip(`unsupported ${kind} ${describe(value)}`);
  }
  if (!isObject(value) || !isFiniteNumber(value.value)) {
    return skip(`unsupported ${kind} ${describe(value)}`);
  }
  if (typeof value.unit !== "string" || !units.includes(value.unit)) {
    return skip(`unsupported ${kind} unit ${describe(value.unit)}`);
  }
  return ok(quote(`${formatNumber(value.value)}${value.unit}`));
}

function fontFamilyArg(value: unknown): Converted {
  const families = typeof value === "string" ? [value] : value;
  if (!Array.isArray(families) || families.length === 0) {
    return skip(`unsupported fontFamily ${describe(value)}`);
  }
  if (!families.every((family) => typeof family === "string" && family.trim() !== "")) {
    return skip(`unsupported fontFamily ${describe(value)}`);
  }
  // The factory splits on commas and strips quotes itself, so stacks pass through as-is.
  const stack = (families as string[]).join(", ");
  try {
    tokens.fontFamily(stack);
  } catch {
    return skip(`unsupported fontFamily ${describe(value)}`);
  }
  return ok(quote(stack));
}

function fontWeightArg(value: unknown): Converted {
  if (typeof value === "string" && Object.hasOwn(FONT_WEIGHT_NUMERIC, value.trim().toLowerCase())) {
    return ok(quote(value.trim().toLowerCase()));
  }
  const numeric = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : value;
  if (isFiniteNumber(numeric) && numeric >= 1 && numeric <= 1000) return ok(String(numeric));
  return skip(`unsupported fontWeight ${describe(value)}`);
}

function numberArg(value: unknown): Converted {
  return isFiniteNumber(value) ? ok(String(value)) : skip(`unsupported number ${describe(value)}`);
}

function cubicBezierArg(value: unknown): Converted {
  return Array.isArray(value) && value.length === 4 && value.every(isFiniteNumber)
    ? ok(`[${value.join(", ")}]`)
    : skip(`unsupported cubicBezier ${describe(value)}`);
}

function strokeStyleArg(value: unknown): Converted {
  if (typeof value === "string") {
    return STROKE_STYLES.includes(value)
      ? ok(quote(value))
      : skip(`unsupported strokeStyle ${describe(value)}`);
  }
  if (isObject(value) && Array.isArray(value.dashArray) && value.dashArray.length > 0) {
    if (typeof value.lineCap !== "string" || !LINE_CAPS.includes(value.lineCap)) {
      return skip(`unsupported strokeStyle lineCap ${describe(value.lineCap)}`);
    }
    const dashes: string[] = [];
    for (const dash of value.dashArray) {
      const converted = unitArg(dash, DIMENSION_UNITS, "dimension");
      if ("skip" in converted) return converted;
      dashes.push(converted.expr);
    }
    return ok(`{ dashArray: [${dashes.join(", ")}], lineCap: ${quote(value.lineCap)} }`);
  }
  return skip(`unsupported strokeStyle ${describe(value)}`);
}

type MemberFactory = (value: unknown) => Converted;

const PRIMITIVES: Record<string, MemberFactory> = {
  color: colorArg,
  dimension: (value) => unitArg(value, DIMENSION_UNITS, "dimension"),
  duration: (value) => unitArg(value, DURATION_UNITS, "duration"),
  fontFamily: fontFamilyArg,
  fontWeight: fontWeightArg,
  number: numberArg,
  cubicBezier: cubicBezierArg,
  strokeStyle: strokeStyleArg,
};

export const SUPPORTED_TYPES = new Set([
  ...Object.keys(PRIMITIVES),
  "shadow",
  "border",
  "transition",
  "gradient",
  "typography",
]);

type ConvertOptions = {
  resolveMember: ResolveMember;
  warn: (message: string) => void;
};

function objectFields(
  value: unknown,
  what: string,
  required: string[],
): { fields: Record<string, unknown> } | { skip: string } {
  if (!isObject(value)) return { skip: `unsupported ${what} ${describe(value)}` };
  const missing = required.filter((key) => value[key] === undefined);
  return missing.length > 0
    ? { skip: `${what} is missing ${missing.join(", ")}` }
    : { fields: value };
}

export function convertValue(type: string, value: unknown, options: ConvertOptions): Converted {
  if (containsJsonPointer(value)) return skip("uses a $ref JSON pointer, which is not supported");

  /** A member that is either an alias or a literal of `memberType`. */
  const member = (memberType: string, memberValue: unknown): Converted => {
    const reference = aliasTarget(memberValue);
    if (reference !== undefined) return options.resolveMember(reference, memberType);
    return PRIMITIVES[memberType]!(memberValue);
  };

  /** Converts every `[key, memberType]` of `fields`, in order, into `key: expr` pairs. */
  const members = (
    fields: Record<string, unknown>,
    spec: Array<[string, string]>,
  ): { pairs: string[] } | { skip: string } => {
    const pairs: string[] = [];
    for (const [key, memberType] of spec) {
      if (fields[key] === undefined) continue;
      const converted = member(memberType, fields[key]);
      if ("skip" in converted) return { skip: `${key}: ${converted.skip}` };
      pairs.push(`${key}: ${converted.expr}`);
    }
    return { pairs };
  };

  const primitive = PRIMITIVES[type];
  if (primitive) {
    const converted = primitive(value);
    return "skip" in converted ? converted : ok(`tokens.${type}(${converted.expr})`);
  }

  switch (type) {
    case "shadow": {
      const layers = Array.isArray(value) ? value : [value];
      if (layers.length === 0) return skip("shadow has no layers");
      const sources: string[] = [];
      for (const layer of layers) {
        const reference = aliasTarget(layer);
        if (reference !== undefined) {
          const converted = options.resolveMember(reference, "shadow");
          if ("skip" in converted) return converted;
          sources.push(converted.expr);
          continue;
        }
        const parsed = objectFields(layer, "shadow layer", [
          "color",
          "offsetX",
          "offsetY",
          "blur",
          "spread",
        ]);
        if ("skip" in parsed) return parsed;
        const result = members(parsed.fields, [
          ["color", "color"],
          ["offsetX", "dimension"],
          ["offsetY", "dimension"],
          ["blur", "dimension"],
          ["spread", "dimension"],
        ]);
        if ("skip" in result) return result;
        if (parsed.fields.inset === true) result.pairs.push("inset: true");
        sources.push(`{ ${result.pairs.join(", ")} }`);
      }
      return ok(`tokens.shadow(${sources.length === 1 ? sources[0]! : `[${sources.join(", ")}]`})`);
    }
    case "border": {
      const parsed = objectFields(value, "border", ["color", "width"]);
      if ("skip" in parsed) return parsed;
      const result = members(parsed.fields, [
        ["color", "color"],
        ["width", "dimension"],
        ["style", "strokeStyle"],
      ]);
      return "skip" in result ? result : ok(`tokens.border({ ${result.pairs.join(", ")} })`);
    }
    case "transition": {
      const parsed = objectFields(value, "transition", ["duration", "timingFunction"]);
      if ("skip" in parsed) return parsed;
      const result = members(parsed.fields, [
        ["duration", "duration"],
        ["delay", "duration"],
        ["timingFunction", "cubicBezier"],
      ]);
      return "skip" in result ? result : ok(`tokens.transition({ ${result.pairs.join(", ")} })`);
    }
    case "gradient": {
      if (!Array.isArray(value) || value.length < 2) {
        return skip("gradient needs at least 2 stops");
      }
      const stops: string[] = [];
      for (const stop of value) {
        const reference = aliasTarget(stop);
        if (reference !== undefined) {
          const converted = options.resolveMember(reference, "gradient");
          if ("skip" in converted) return converted;
          stops.push(converted.expr);
          continue;
        }
        const parsed = objectFields(stop, "gradient stop", ["color", "position"]);
        if ("skip" in parsed) return parsed;
        const result = members(parsed.fields, [
          ["color", "color"],
          ["position", "number"],
        ]);
        if ("skip" in result) return result;
        stops.push(`{ ${result.pairs.join(", ")} }`);
      }
      return ok(`tokens.gradient({ stops: [${stops.join(", ")}] })`);
    }
    case "typography": {
      const parsed = objectFields(value, "typography", ["fontFamily", "fontSize", "fontWeight"]);
      if ("skip" in parsed) return parsed;
      const unknownKeys = Object.keys(parsed.fields).filter(
        (key) => !TYPOGRAPHY_KEYS.includes(key),
      );
      if (unknownKeys.length > 0) {
        options.warn(`Dropped unsupported typography properties: ${unknownKeys.join(", ")}.`);
      }
      const fields = { ...parsed.fields };
      // DTCG allows a bare 0 for letter spacing; recontent wants a dimension.
      if (fields.letterSpacing === 0) fields.letterSpacing = "0px";
      const result = members(fields, [
        ["fontFamily", "fontFamily"],
        ["fontSize", "dimension"],
        ["fontWeight", "fontWeight"],
        ["letterSpacing", "dimension"],
        ["lineHeight", "number"],
      ]);
      return "skip" in result ? result : ok(`tokens.typography({ ${result.pairs.join(", ")} })`);
    }
    default:
      return skip(`unsupported $type ${describe(type)}`);
  }
}
