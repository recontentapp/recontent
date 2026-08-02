import type {
  BorderValue,
  ColorValue,
  Component,
  CubicBezierValue,
  DurationValue,
  FontFamilyValue,
  FontWeightName,
  FontWeightValue,
  GradientValue,
  NumberValue,
  RawToken,
  ShadowLayer,
  ShadowValue,
  StampedToken,
  StrokeStyleName,
  StrokeStyleValue,
  TokenMember,
  TokenScale,
  TokenType,
  TransitionValue,
  TypographyValue,
} from "@recontentapp/core";
import {
  componentRanges,
  isRawToken,
  isStampedToken,
  isTokenLeaf,
  toSrgbHex,
} from "@recontentapp/core";
import { withRawTokenMethods, type ChainableMethods } from "./metadata.js";

type ColorInput =
  | string
  | {
      colorSpace: ColorValue["colorSpace"];
      components: [Component, Component, Component];
      alpha?: number;
    };

const FONT_WEIGHT_MAP: Record<FontWeightName, number> = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  "extra-light": 200,
  "ultra-light": 200,
  light: 300,
  book: 350,
  regular: 400,
  normal: 400,
  medium: 500,
  semibold: 600,
  "semi-bold": 600,
  "demi-bold": 600,
  bold: 700,
  extrabold: 800,
  "extra-bold": 800,
  "ultra-bold": 800,
  black: 900,
  heavy: 900,
  extrablack: 950,
  "extra-black": 950,
  "ultra-black": 950,
};

function createRawToken<T extends TokenType>(
  type: T,
  value: import("@recontentapp/core").TokenTypeMap[T],
): RawToken<T> & ChainableMethods<RawToken<T>> {
  return withRawTokenMethods({ _kind: "raw", $type: type, $value: value });
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

function validateComponentRanges(
  colorSpace: ColorValue["colorSpace"],
  components: [Component, Component, Component],
): void {
  const ranges = componentRanges(colorSpace);
  components.forEach((component, index) => {
    if (component === "none") return;
    const range = ranges[index]!;
    if (component < range.min || component > range.max) {
      throw new Error(
        `Invalid component ${index} for colorSpace "${colorSpace}": ${component}. Expected a value between ${range.min} and ${range.max}.`,
      );
    }
  });
}

function color(input: ColorInput): RawToken<"color"> & ChainableMethods<RawToken<"color">> {
  if (typeof input === "string") {
    return createRawToken("color", parseHex(input));
  }

  validateComponentRanges(input.colorSpace, input.components);
  const alpha = input.alpha ?? 1;
  const value: ColorValue = {
    colorSpace: input.colorSpace,
    components: input.components,
    alpha,
    hex: toSrgbHex(input.colorSpace, input.components),
  };

  return createRawToken("color", value);
}

function dimension(input: string): RawToken<"dimension"> & ChainableMethods<RawToken<"dimension">> {
  const match = input.trim().match(/^(-?\d*\.?\d+)(px|rem)$/);
  if (!match) {
    throw new Error(`Invalid dimension: ${input}. Expected format like "16px" or "1rem".`);
  }

  return createRawToken("dimension", {
    value: Number(match[1]),
    unit: match[2] as "px" | "rem",
  });
}

function fontFamily(
  input: string,
): RawToken<"fontFamily"> & ChainableMethods<RawToken<"fontFamily">> {
  const families = input
    .split(",")
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  return createRawToken("fontFamily", { value: families });
}

function fontWeight(
  input: number | FontWeightName,
): RawToken<"fontWeight"> & ChainableMethods<RawToken<"fontWeight">> {
  if (typeof input === "number") {
    if (input < 1 || input > 1000) {
      throw new Error(`Invalid fontWeight: ${input}. Expected a number between 1 and 1000.`);
    }
    return createRawToken("fontWeight", { value: input });
  }

  return createRawToken("fontWeight", { value: FONT_WEIGHT_MAP[input] });
}

function duration(input: string): RawToken<"duration"> & ChainableMethods<RawToken<"duration">> {
  const match = input.trim().match(/^(-?\d*\.?\d+)(ms|s)$/);
  if (!match) {
    throw new Error(`Invalid duration: ${input}. Expected format like "200ms" or "1s".`);
  }

  return createRawToken("duration", {
    value: Number(match[1]),
    unit: match[2] as "ms" | "s",
  });
}

function cubicBezier(
  value: [number, number, number, number],
): RawToken<"cubicBezier"> & ChainableMethods<RawToken<"cubicBezier">> {
  return createRawToken("cubicBezier", { value });
}

function number(value: number): RawToken<"number"> & ChainableMethods<RawToken<"number">> {
  return createRawToken("number", { value });
}

function toMember<T extends TokenType>(
  input: unknown,
  coerce: (raw: never) => RawToken<T>,
): TokenMember<T> {
  if (isStampedToken(input)) {
    return {
      $value: input.$value as import("@recontentapp/core").TokenTypeMap[T],
      alias: input._path,
    };
  }
  if (isRawToken(input)) {
    return { $value: input.$value as import("@recontentapp/core").TokenTypeMap[T] };
  }
  return { $value: coerce(input as never).$value };
}

const STROKE_STYLE_NAMES: StrokeStyleName[] = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "outset",
  "inset",
];

type StrokeStyleInput =
  | StrokeStyleName
  | {
      dashArray: Array<string | RawToken<"dimension"> | StampedToken<"dimension">>;
      lineCap: "round" | "butt" | "square";
    };

function strokeStyle(
  input: StrokeStyleInput,
): RawToken<"strokeStyle"> & ChainableMethods<RawToken<"strokeStyle">> {
  if (typeof input === "string") {
    if (!STROKE_STYLE_NAMES.includes(input)) {
      throw new Error(
        `Invalid strokeStyle: "${input}". Expected one of ${STROKE_STYLE_NAMES.join(", ")}.`,
      );
    }
    return createRawToken("strokeStyle", { style: input });
  }

  if (!input.dashArray || input.dashArray.length === 0) {
    throw new Error("tokens.strokeStyle(...) with a custom dash requires a non-empty dashArray.");
  }
  if (!["round", "butt", "square"].includes(input.lineCap)) {
    throw new Error(`Invalid lineCap: "${input.lineCap}". Expected "round", "butt", or "square".`);
  }

  const dashArray = input.dashArray.map((item) =>
    typeof item === "string" ? dimension(item).$value : item.$value,
  );

  const value: StrokeStyleValue = { dashArray, lineCap: input.lineCap };
  return createRawToken("strokeStyle", value);
}

type ShadowLayerInput =
  | {
      color: ColorInput | RawToken<"color"> | StampedToken<"color">;
      offsetX: string | RawToken<"dimension"> | StampedToken<"dimension">;
      offsetY: string | RawToken<"dimension"> | StampedToken<"dimension">;
      blur: string | RawToken<"dimension"> | StampedToken<"dimension">;
      spread: string | RawToken<"dimension"> | StampedToken<"dimension">;
      inset?: boolean;
    }
  | RawToken<"shadow">
  | StampedToken<"shadow">;

function toShadowLayer(input: ShadowLayerInput): ShadowLayer | TokenMember<"shadow"> {
  if (isStampedToken(input) || isRawToken(input)) {
    return toMember<"shadow">(input, () => {
      throw new Error("Unreachable");
    });
  }

  if (!input.color || !input.offsetX || !input.offsetY || !input.blur || !input.spread) {
    throw new Error(
      "tokens.shadow(...) requires color, offsetX, offsetY, blur, and spread for every layer.",
    );
  }

  return {
    color: toMember(input.color, (raw) => color(raw as ColorInput)),
    offsetX: toMember(input.offsetX, (raw) => dimension(raw as string)),
    offsetY: toMember(input.offsetY, (raw) => dimension(raw as string)),
    blur: toMember(input.blur, (raw) => dimension(raw as string)),
    spread: toMember(input.spread, (raw) => dimension(raw as string)),
    ...(input.inset !== undefined ? { inset: input.inset } : {}),
  };
}

function shadow(
  input: ShadowLayerInput | ShadowLayerInput[],
): RawToken<"shadow"> & ChainableMethods<RawToken<"shadow">> {
  const layers = Array.isArray(input) ? input : [input];
  if (layers.length === 0) {
    throw new Error("tokens.shadow(...) requires at least one layer.");
  }

  const value: ShadowValue = { layers: layers.map(toShadowLayer) };
  return createRawToken("shadow", value);
}

type BorderInput = {
  color: ColorInput | RawToken<"color"> | StampedToken<"color">;
  width: string | RawToken<"dimension"> | StampedToken<"dimension">;
  style?: StrokeStyleInput | RawToken<"strokeStyle"> | StampedToken<"strokeStyle">;
};

function border(input: BorderInput): RawToken<"border"> & ChainableMethods<RawToken<"border">> {
  if (!input.color || !input.width) {
    throw new Error("tokens.border(...) requires color and width.");
  }

  const value: BorderValue = {
    color: toMember(input.color, (raw) => color(raw as ColorInput)),
    width: toMember(input.width, (raw) => dimension(raw as string)),
    style: toMember(input.style ?? "solid", (raw) => strokeStyle(raw as StrokeStyleInput)),
  };
  return createRawToken("border", value);
}

type TransitionInput = {
  duration: string | RawToken<"duration"> | StampedToken<"duration">;
  delay?: string | RawToken<"duration"> | StampedToken<"duration">;
  timingFunction:
    | [number, number, number, number]
    | RawToken<"cubicBezier">
    | StampedToken<"cubicBezier">;
};

function transition(
  input: TransitionInput,
): RawToken<"transition"> & ChainableMethods<RawToken<"transition">> {
  if (!input.duration || !input.timingFunction) {
    throw new Error("tokens.transition(...) requires duration and timingFunction.");
  }

  const value: TransitionValue = {
    duration: toMember(input.duration, (raw) => duration(raw as string)),
    delay: toMember(input.delay ?? "0ms", (raw) => duration(raw as string)),
    timingFunction: toMember(input.timingFunction, (raw) =>
      cubicBezier(raw as [number, number, number, number]),
    ),
  };
  return createRawToken("transition", value);
}

type GradientStopInput = {
  color: ColorInput | RawToken<"color"> | StampedToken<"color">;
  position: number | RawToken<"number"> | StampedToken<"number">;
};
type GradientInput = {
  kind?: "linear" | "radial" | "conic";
  angle?: string;
  stops: Array<GradientStopInput | RawToken<"gradient"> | StampedToken<"gradient">>;
};

function clampPosition(position: number): number {
  return Math.min(1, Math.max(0, position));
}

function toGradientStop(
  input: GradientStopInput | RawToken<"gradient"> | StampedToken<"gradient">,
): { color: TokenMember<"color">; position: TokenMember<"number"> } | TokenMember<"gradient"> {
  if (isStampedToken(input) || isRawToken(input)) {
    return toMember<"gradient">(input, () => {
      throw new Error("Unreachable");
    });
  }

  return {
    color: toMember(input.color, (raw) => color(raw as ColorInput)),
    position: toMember(input.position, (raw) => number(clampPosition(raw as number))),
  };
}

function gradient(
  input: GradientInput,
): RawToken<"gradient"> & ChainableMethods<RawToken<"gradient">> {
  if (!input.stops || input.stops.length < 2) {
    throw new Error("tokens.gradient(...) requires at least 2 stops.");
  }

  const value: GradientValue = {
    kind: input.kind ?? "linear",
    angle: input.angle ?? "180deg",
    stops: input.stops.map(toGradientStop),
  };
  return createRawToken("gradient", value);
}

type TypographyInput = {
  fontFamily: string | RawToken<"fontFamily"> | StampedToken<"fontFamily">;
  fontSize: string | RawToken<"dimension"> | StampedToken<"dimension">;
  fontWeight: number | FontWeightName | RawToken<"fontWeight"> | StampedToken<"fontWeight">;
  letterSpacing?: string | RawToken<"dimension"> | StampedToken<"dimension">;
  lineHeight?: number | RawToken<"number"> | StampedToken<"number">;
};

function typography(
  input: TypographyInput,
): RawToken<"typography"> & ChainableMethods<RawToken<"typography">> {
  if (!input.fontFamily || !input.fontSize || input.fontWeight === undefined) {
    throw new Error("tokens.typography(...) requires fontFamily, fontSize, and fontWeight.");
  }

  const value: TypographyValue = {
    fontFamily: toMember(input.fontFamily, (raw) => fontFamily(raw as string)),
    fontSize: toMember(input.fontSize, (raw) => dimension(raw as string)),
    fontWeight: toMember(input.fontWeight, (raw) => fontWeight(raw as number | FontWeightName)),
    letterSpacing: toMember(input.letterSpacing ?? "0px", (raw) => dimension(raw as string)),
    lineHeight: toMember(input.lineHeight ?? 1.4, (raw) => number(raw as number)),
  };
  return createRawToken("typography", value);
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

function numberScale<Key extends string | number>(
  scale: Record<Key, number | RawToken<"number"> | StampedToken<"number">>,
): TokenScale<Key, "number", RawToken<"number"> | StampedToken<"number">> {
  const result = {} as Record<Key, RawToken<"number"> | StampedToken<"number">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, number | RawToken<"number"> | StampedToken<"number">]
  >) {
    result[step as Key] = isTokenLeaf(input) ? input : number(input);
  }
  return createScale("number", result);
}

function durationScale<Key extends string | number>(
  scale: Record<Key, string | RawToken<"duration"> | StampedToken<"duration">>,
): TokenScale<Key, "duration", RawToken<"duration"> | StampedToken<"duration">> {
  const result = {} as Record<Key, RawToken<"duration"> | StampedToken<"duration">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, string | RawToken<"duration"> | StampedToken<"duration">]
  >) {
    result[step as Key] = typeof input === "string" ? duration(input) : input;
  }
  return createScale("duration", result);
}

function borderScale<Key extends string | number>(
  scale: Record<Key, BorderInput | RawToken<"border"> | StampedToken<"border">>,
): TokenScale<Key, "border", RawToken<"border"> | StampedToken<"border">> {
  const result = {} as Record<Key, RawToken<"border"> | StampedToken<"border">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, BorderInput | RawToken<"border"> | StampedToken<"border">]
  >) {
    result[step as Key] = isTokenLeaf(input) ? input : border(input);
  }
  return createScale("border", result);
}

function cubicBezierScale<Key extends string | number>(
  scale: Record<
    Key,
    [number, number, number, number] | RawToken<"cubicBezier"> | StampedToken<"cubicBezier">
  >,
): TokenScale<Key, "cubicBezier", RawToken<"cubicBezier"> | StampedToken<"cubicBezier">> {
  const result = {} as Record<Key, RawToken<"cubicBezier"> | StampedToken<"cubicBezier">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [
      string,
      [number, number, number, number] | RawToken<"cubicBezier"> | StampedToken<"cubicBezier">,
    ]
  >) {
    result[step as Key] = isTokenLeaf(input) ? input : cubicBezier(input);
  }
  return createScale("cubicBezier", result);
}

function gradientScale<Key extends string | number>(
  scale: Record<Key, GradientInput | RawToken<"gradient"> | StampedToken<"gradient">>,
): TokenScale<Key, "gradient", RawToken<"gradient"> | StampedToken<"gradient">> {
  const result = {} as Record<Key, RawToken<"gradient"> | StampedToken<"gradient">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, GradientInput | RawToken<"gradient"> | StampedToken<"gradient">]
  >) {
    result[step as Key] = isTokenLeaf(input) ? input : gradient(input);
  }
  return createScale("gradient", result);
}

function transitionScale<Key extends string | number>(
  scale: Record<Key, TransitionInput | RawToken<"transition"> | StampedToken<"transition">>,
): TokenScale<Key, "transition", RawToken<"transition"> | StampedToken<"transition">> {
  const result = {} as Record<Key, RawToken<"transition"> | StampedToken<"transition">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, TransitionInput | RawToken<"transition"> | StampedToken<"transition">]
  >) {
    result[step as Key] = isTokenLeaf(input) ? input : transition(input);
  }
  return createScale("transition", result);
}

function shadowScale<Key extends string | number>(
  scale: Record<
    Key,
    ShadowLayerInput | ShadowLayerInput[] | RawToken<"shadow"> | StampedToken<"shadow">
  >,
): TokenScale<Key, "shadow", RawToken<"shadow"> | StampedToken<"shadow">> {
  const result = {} as Record<Key, RawToken<"shadow"> | StampedToken<"shadow">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, ShadowLayerInput | ShadowLayerInput[] | RawToken<"shadow"> | StampedToken<"shadow">]
  >) {
    result[step as Key] = isTokenLeaf(input) ? input : shadow(input);
  }
  return createScale("shadow", result);
}

function typographyScale<Key extends string | number>(
  scale: Record<Key, TypographyInput | RawToken<"typography"> | StampedToken<"typography">>,
): TokenScale<Key, "typography", RawToken<"typography"> | StampedToken<"typography">> {
  const result = {} as Record<Key, RawToken<"typography"> | StampedToken<"typography">>;
  for (const [step, input] of Object.entries(scale) as Array<
    [string, TypographyInput | RawToken<"typography"> | StampedToken<"typography">]
  >) {
    result[step as Key] = isTokenLeaf(input) ? input : typography(input);
  }
  return createScale("typography", result);
}

export const tokens = {
  color,
  dimension,
  fontFamily,
  fontWeight,
  duration,
  cubicBezier,
  number,
  colorScale,
  dimensionScale,
  numberScale,
  durationScale,
  borderScale,
  cubicBezierScale,
  gradientScale,
  shadowScale,
  transitionScale,
  typographyScale,
  strokeStyle,
  shadow,
  border,
  transition,
  gradient,
  typography,
};

export type {
  BorderValue,
  ColorValue,
  CubicBezierValue,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  GradientValue,
  NumberValue,
  ShadowValue,
  StrokeStyleValue,
  TransitionValue,
  TypographyValue,
};
