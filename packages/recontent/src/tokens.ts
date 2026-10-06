import type {
  BorderValue,
  ColorValue,
  Component,
  FontWeightName,
  GradientValue,
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
  FONT_WEIGHT_NUMERIC,
  isRawToken,
  isStampedToken,
  isTokenLeaf,
  fitOklchToSrgb,
  toOklch,
  toSrgbHex,
} from "@recontentapp/core";
import { generateScale, SCALE_STEPS } from "./color-scale.js";
import { withRawTokenMethods, withScaleMethods, type ChainableMethods } from "./metadata.js";

type ColorInput =
  | string
  | {
      colorSpace: ColorValue["colorSpace"];
      components: [Component, Component, Component];
      alpha?: number;
    };

function createRawToken<T extends TokenType>(
  type: T,
  value: import("@recontentapp/core").TokenTypeMap[T],
): RawToken<T> & ChainableMethods<RawToken<T>> {
  return withRawTokenMethods({ _kind: "raw", $type: type, $value: value });
}

const HEX_CHARS_RE = /^[0-9a-fA-F]+$/;

function parseHex(hex: string): ColorValue {
  const normalized = hex.trim().replace(/^#/, "");

  if (
    (normalized.length === 3 ||
      normalized.length === 4 ||
      normalized.length === 6 ||
      normalized.length === 8) &&
    !HEX_CHARS_RE.test(normalized)
  ) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

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

// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_RE = /[\u0000-\u0008\u000A-\u001F\u007F\u2028\u2029]/;

function fontFamily(
  input: string,
): RawToken<"fontFamily"> & ChainableMethods<RawToken<"fontFamily">> {
  const families = input
    .split(",")
    .map((f) => f.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);

  for (const family of families) {
    if (CONTROL_CHAR_RE.test(family)) {
      throw new Error(`Invalid fontFamily: ${JSON.stringify(input)} contains control characters.`);
    }
  }

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

  return createRawToken("fontWeight", { value: FONT_WEIGHT_NUMERIC[input] });
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

function memberFromToken<T extends TokenType>(
  token: RawToken<T> | StampedToken<T>,
): TokenMember<T> {
  if ("_path" in token) {
    return {
      $value: token.$value as import("@recontentapp/core").TokenTypeMap[T],
      alias: token._path,
    };
  }
  return {
    $value: token.$value as import("@recontentapp/core").TokenTypeMap[T],
  };
}

function toMember<T extends TokenType>(
  input: unknown,
  coerce: (raw: never) => RawToken<T>,
): TokenMember<T> {
  if (isStampedToken(input) || isRawToken(input)) {
    return memberFromToken(input as RawToken<T> | StampedToken<T>);
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
    return memberFromToken(input);
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
    return memberFromToken(input);
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

type ChainableScale<
  Key extends string | number,
  T extends TokenType,
  Value extends RawToken<T> | StampedToken<T>,
> = TokenScale<Key, T, Value>;

function createScale<
  Key extends string | number,
  T extends TokenType,
  Value extends RawToken<T> | StampedToken<T>,
>(type: T, scale: Record<Key, Value>): ChainableScale<Key, T, Value> {
  Object.defineProperties(scale, {
    _kind: { value: "scale", enumerable: false },
    $type: { value: type, enumerable: false },
  });
  return withScaleMethods(scale as TokenScale<Key, T, Value>);
}

function scaleFrom<Key extends string | number, T extends TokenType, Value>(
  type: T,
  scale: Record<Key, Value>,
  factory: (input: Exclude<Value, RawToken<T> | StampedToken<T>>) => RawToken<T>,
): ChainableScale<Key, T, RawToken<T> | StampedToken<T>> {
  const result = {} as Record<Key, RawToken<T> | StampedToken<T>>;
  for (const [step, input] of Object.entries(scale) as Array<[string, Value]>) {
    result[step as Key] = isTokenLeaf(input)
      ? (input as RawToken<T> | StampedToken<T>)
      : factory(input as Exclude<Value, RawToken<T> | StampedToken<T>>);
  }
  return createScale(type, result);
}

function colorScale<Key extends string | number>(
  scale: Record<Key, ColorInput | RawToken<"color"> | StampedToken<"color">>,
): ChainableScale<Key, "color", RawToken<"color"> | StampedToken<"color">> {
  return scaleFrom("color", scale, color);
}

type ScaleStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
const DEFAULT_SCALE_STEPS: readonly ScaleStep[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type GenerateColorScaleInput<Key extends string | number> = {
  /**
   * The color the scale is built around. For an accent scale it is used verbatim as step 9,
   * unless it is close to the page background.
   */
  base: ColorInput | RawToken<"color">;
  /**
   * Whether the scale sits on a white page ("light") or a near-black one ("dark").
   * Defaults to "light".
   */
  appearance?: "light" | "dark";
  /**
   * Generate a gray scale (backgrounds, borders and text) tinted towards `base`, instead of
   * an accent scale. Step 9 is then not pinned to `base`.
   */
  neutral?: boolean;
  /** Exactly 12 keys for steps 1-12, from background to text. Defaults to 1..12. */
  steps?: readonly Key[];
};

function colorValueOf(input: ColorInput | RawToken<"color">): ColorValue {
  return isRawToken(input) ? input.$value : color(input).$value;
}

/**
 * Generates a 12-step UI color scale from a single color, the way Radix Colors' custom palette
 * tool does: the two closest hand-tuned reference scales are blended, re-hued to `base`, and
 * shifted to sit on the page background. Steps 1-2 are backgrounds, 3-5 interactive components, 6-8
 * borders, 9-10 solid colors (9 is `base`, 10 its hover state) and 11-12 text.
 * Generated steps are fitted to the sRGB gamut and emitted as oklch colors.
 */
function generateColorScale<Key extends string | number = ScaleStep>(
  input: GenerateColorScaleInput<Key>,
): ChainableScale<Key, "color", RawToken<"color"> | StampedToken<"color">> {
  const steps = (input.steps ?? DEFAULT_SCALE_STEPS) as readonly Key[];
  if (steps.length !== SCALE_STEPS) {
    throw new Error(
      `tokens.generateColorScale(...) requires exactly ${SCALE_STEPS} steps, received ${steps.length}.`,
    );
  }
  if (new Set(steps.map(String)).size !== steps.length) {
    throw new Error("tokens.generateColorScale(...) requires unique steps.");
  }

  const appearance = input.appearance ?? "light";
  if (appearance !== "light" && appearance !== "dark") {
    throw new Error(
      `Invalid appearance: ${JSON.stringify(appearance)}. Expected "light" or "dark".`,
    );
  }

  const baseValue = colorValueOf(input.base);
  const { steps: generated, baseIndex } = generateScale({
    base: toOklch(baseValue.colorSpace, baseValue.components),
    baseHex: toSrgbHex(baseValue.colorSpace, baseValue.components),
    appearance,
    neutral: input.neutral ?? false,
  });

  const scale = {} as Record<Key, ColorInput | RawToken<"color">>;
  steps.forEach((step, index) => {
    if (index === baseIndex) {
      scale[step] = input.base;
      return;
    }
    const [l, c, h] = fitOklchToSrgb(generated[index]!);
    scale[step] = {
      colorSpace: "oklch",
      components: [roundTo(l, 4), floorTo(c, 4), roundTo(h, 2)],
    };
  });
  return colorScale(scale);
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

// Floors so that rounding can never push a gamut-fitted chroma back out of gamut.
function floorTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.floor(value * factor) / factor;
}

function dimensionScale<Key extends string | number>(
  scale: Record<Key, string | RawToken<"dimension"> | StampedToken<"dimension">>,
): ChainableScale<Key, "dimension", RawToken<"dimension"> | StampedToken<"dimension">> {
  return scaleFrom("dimension", scale, dimension);
}

function numberScale<Key extends string | number>(
  scale: Record<Key, number | RawToken<"number"> | StampedToken<"number">>,
): ChainableScale<Key, "number", RawToken<"number"> | StampedToken<"number">> {
  return scaleFrom("number", scale, number);
}

function durationScale<Key extends string | number>(
  scale: Record<Key, string | RawToken<"duration"> | StampedToken<"duration">>,
): ChainableScale<Key, "duration", RawToken<"duration"> | StampedToken<"duration">> {
  return scaleFrom("duration", scale, duration);
}

function borderScale<Key extends string | number>(
  scale: Record<Key, BorderInput | RawToken<"border"> | StampedToken<"border">>,
): ChainableScale<Key, "border", RawToken<"border"> | StampedToken<"border">> {
  return scaleFrom("border", scale, border);
}

function cubicBezierScale<Key extends string | number>(
  scale: Record<
    Key,
    [number, number, number, number] | RawToken<"cubicBezier"> | StampedToken<"cubicBezier">
  >,
): ChainableScale<Key, "cubicBezier", RawToken<"cubicBezier"> | StampedToken<"cubicBezier">> {
  return scaleFrom("cubicBezier", scale, cubicBezier);
}

function gradientScale<Key extends string | number>(
  scale: Record<Key, GradientInput | RawToken<"gradient"> | StampedToken<"gradient">>,
): ChainableScale<Key, "gradient", RawToken<"gradient"> | StampedToken<"gradient">> {
  return scaleFrom("gradient", scale, gradient);
}

function transitionScale<Key extends string | number>(
  scale: Record<Key, TransitionInput | RawToken<"transition"> | StampedToken<"transition">>,
): ChainableScale<Key, "transition", RawToken<"transition"> | StampedToken<"transition">> {
  return scaleFrom("transition", scale, transition);
}

function shadowScale<Key extends string | number>(
  scale: Record<
    Key,
    ShadowLayerInput | ShadowLayerInput[] | RawToken<"shadow"> | StampedToken<"shadow">
  >,
): ChainableScale<Key, "shadow", RawToken<"shadow"> | StampedToken<"shadow">> {
  return scaleFrom("shadow", scale, shadow);
}

function typographyScale<Key extends string | number>(
  scale: Record<Key, TypographyInput | RawToken<"typography"> | StampedToken<"typography">>,
): ChainableScale<Key, "typography", RawToken<"typography"> | StampedToken<"typography">> {
  return scaleFrom("typography", scale, typography);
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
  generateColorScale,
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
