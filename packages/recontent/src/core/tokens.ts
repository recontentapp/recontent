import type {
  ColorValue,
  CubicBezierValue,
  DurationValue,
  FontFamilyValue,
  FontWeightName,
  FontWeightValue,
  NumberValue,
  RawToken,
  StampedToken,
  StringValue,
  TokenScale,
  TokenType,
} from "@recontentapp/core";
import { isTokenLeaf } from "@recontentapp/core";

type ColorInput =
  | string
  | {
      colorSpace: ColorValue["colorSpace"];
      components: [number, number, number];
      alpha?: number;
    };

const FONT_WEIGHT_MAP: Record<FontWeightName, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

function createRawToken<T extends TokenType>(
  type: T,
  value: import("@recontentapp/core").TokenTypeMap[T],
): RawToken<T> {
  return { _kind: "raw", $type: type, $value: value };
}

function parseHex(hex: string): ColorValue {
  const normalized = hex.trim().replace(/^#/, "");

  let r: number;
  let g: number;
  let b: number;
  let alpha = 1;

  if (normalized.length === 3 || normalized.length === 4) {
    r = parseInt(normalized[0]! + normalized[0]!, 16);
    g = parseInt(normalized[1]! + normalized[1]!, 16);
    b = parseInt(normalized[2]! + normalized[2]!, 16);
    if (normalized.length === 4) {
      alpha = parseInt(normalized[3]! + normalized[3]!, 16) / 255;
    }
  } else if (normalized.length === 6 || normalized.length === 8) {
    r = parseInt(normalized.slice(0, 2), 16);
    g = parseInt(normalized.slice(2, 4), 16);
    b = parseInt(normalized.slice(4, 6), 16);
    if (normalized.length === 8) {
      alpha = parseInt(normalized.slice(6, 8), 16) / 255;
    }
  } else {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const components: [number, number, number] = [r / 255, g / 255, b / 255];

  const fullHex =
    normalized.length <= 4
      ? `#${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`
      : `#${normalized.slice(0, 6)}`;

  return {
    colorSpace: "srgb",
    components,
    alpha,
    hex: fullHex.toLowerCase(),
  };
}

function componentsToHex(components: [number, number, number], alpha = 1): string {
  const toByte = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n * 255)))
      .toString(16)
      .padStart(2, "0");

  const hex = `#${toByte(components[0])}${toByte(components[1])}${toByte(components[2])}`;
  if (alpha < 1) {
    return `${hex}${toByte(alpha)}`;
  }
  return hex;
}

function color(input: ColorInput): RawToken<"color"> {
  if (typeof input === "string") {
    return createRawToken("color", parseHex(input));
  }

  const alpha = input.alpha ?? 1;
  const value: ColorValue = {
    colorSpace: input.colorSpace,
    components: input.components,
    alpha,
    hex: componentsToHex(input.components, alpha),
  };

  return createRawToken("color", value);
}

function dimension(input: string): RawToken<"dimension"> {
  const match = input.trim().match(/^(-?\d*\.?\d+)(px|rem)$/);
  if (!match) {
    throw new Error(`Invalid dimension: ${input}. Expected format like "16px" or "1rem".`);
  }

  return createRawToken("dimension", {
    value: Number(match[1]),
    unit: match[2] as "px" | "rem",
  });
}

function fontFamily(input: string): RawToken<"fontFamily"> {
  const families = input
    .split(",")
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  return createRawToken("fontFamily", { value: families });
}

function fontWeight(input: number | FontWeightName): RawToken<"fontWeight"> {
  if (typeof input === "number") {
    return createRawToken("fontWeight", { value: input });
  }

  return createRawToken("fontWeight", { value: FONT_WEIGHT_MAP[input] });
}

function duration(input: string): RawToken<"duration"> {
  const match = input.trim().match(/^(-?\d*\.?\d+)(ms|s)$/);
  if (!match) {
    throw new Error(`Invalid duration: ${input}. Expected format like "200ms" or "1s".`);
  }

  return createRawToken("duration", {
    value: Number(match[1]),
    unit: match[2] as "ms" | "s",
  });
}

function cubicBezier(value: [number, number, number, number]): RawToken<"cubicBezier"> {
  return createRawToken("cubicBezier", { value });
}

function number(value: number): RawToken<"number"> {
  return createRawToken("number", { value });
}

function generic(value: string): RawToken<"string"> {
  return createRawToken("string", { value });
}

function createScale<
  Key extends string | number,
  T extends TokenType,
  Value extends RawToken<T> | StampedToken<T>,
>(type: T, scale: Record<Key, Value>): TokenScale<Key, T, Value> {
  Object.defineProperties(scale, {
    _kind: { value: "scale", enumerable: false },
    $type: { value: type, enumerable: false },
  });
  return scale as TokenScale<Key, T, Value>;
}

function colorScale<Key extends string | number>(
  scale: Record<Key, ColorInput | RawToken<"color"> | StampedToken<"color">>,
): TokenScale<Key, "color", RawToken<"color"> | StampedToken<"color">> {
  const result = {} as Record<Key, RawToken<"color"> | StampedToken<"color">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, ColorInput | RawToken<"color"> | StampedToken<"color">]
  >) {
    result[step as Key] = isTokenLeaf(input) ? input : color(input);
  }
  return createScale("color", result);
}

function dimensionScale<Key extends string | number>(
  scale: Record<Key, string | RawToken<"dimension"> | StampedToken<"dimension">>,
): TokenScale<Key, "dimension", RawToken<"dimension"> | StampedToken<"dimension">> {
  const result = {} as Record<Key, RawToken<"dimension"> | StampedToken<"dimension">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, string | RawToken<"dimension"> | StampedToken<"dimension">]
  >) {
    result[step as Key] = typeof input === "string" ? dimension(input) : input;
  }
  return createScale("dimension", result);
}

export const tokens = {
  color,
  dimension,
  fontFamily,
  fontWeight,
  duration,
  cubicBezier,
  number,
  generic,
  colorScale,
  dimensionScale,
};

export type {
  ColorValue,
  CubicBezierValue,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  NumberValue,
  StringValue,
};
