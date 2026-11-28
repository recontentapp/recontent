import type {
  BorderValue,
  ColorValue,
  DimensionValue,
  FontWeightName,
  GradientValue,
  ShadowLayer,
  ShadowValue,
  StrokeStyleName,
  StrokeStyleValue,
  TokenMember,
  TokenType,
  TransitionValue,
  TypographyValue,
} from "../token-model/values.js";
import type { Component } from "../color/spaces.js";
import type { RawToken, StampedToken, TokenGroup, TokenScale } from "../token-model/model.js";
import { componentRanges } from "../color/spaces.js";
import { FONT_WEIGHT_NUMERIC } from "../token-model/values.js";
import { isRawToken, isStampedToken, isTokenLeaf } from "../token-model/guards.js";
import { fitOklchToSrgb, toOklch, toSrgbHex } from "../color/convert.js";
import { parseCssColor } from "../color/parse.js";
import { generateScale, SCALE_STEPS } from "../color/scale.js";
import { roundTo } from "../serialize/native.js";
import {
  assertAlpha,
  withRawTokenMethods,
  withScaleMethods,
  type ChainableMethods,
} from "./metadata.js";

type ColorInput =
  | string
  | {
      colorSpace: ColorValue["colorSpace"];
      components: [Component, Component, Component];
      alpha?: number;
    };

function createRawToken<T extends TokenType>(
  type: T,
  value: import("../token-model/values.js").TokenTypeMap[T],
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
  if (!Array.isArray(components) || components.length !== 3) {
    throw new Error(
      `Invalid components for colorSpace "${colorSpace}": expected an array of 3 components.`,
    );
  }
  const ranges = componentRanges(colorSpace);
  components.forEach((component, index) => {
    if (component === "none") return;
    const range = ranges[index]!;
    if (!Number.isFinite(component) || component < range.min || component > range.max) {
      throw new Error(
        `Invalid component ${index} for colorSpace "${colorSpace}": ${component}. Expected a value between ${range.min} and ${range.max}.`,
      );
    }
  });
}

function color(input: ColorInput): RawToken<"color"> & ChainableMethods<RawToken<"color">> {
  if (typeof input === "string") {
    if (input.trim().startsWith("#")) {
      return createRawToken("color", parseHex(input));
    }
    return color(parseCssColor(input));
  }

  validateComponentRanges(input.colorSpace, input.components);
  const alpha = input.alpha ?? 1;
  assertAlpha(alpha);
  const value: ColorValue = {
    colorSpace: input.colorSpace,
    components: input.components,
    alpha,
    hex: toSrgbHex(input.colorSpace, input.components),
  };

  return createRawToken("color", value);
}

function dimension(input: string): RawToken<"dimension"> & ChainableMethods<RawToken<"dimension">> {
  const match = input.trim().match(/^(-?\d*\.?\d+)(px|rem|em)$/);
  if (!match) {
    throw new Error(`Invalid dimension: ${input}. Expected format like "16px", "1rem" or "1.5em".`);
  }

  return createRawToken("dimension", {
    value: Number(match[1]),
    unit: match[2] as "px" | "rem" | "em",
  });
}

// Family names are emitted unquoted into CSS, so only characters that can't end a declaration are allowed.
const FONT_FAMILY_NAME_RE = /^[\p{L}\p{N} _.-]+$/u;

function stripMatchingQuotes(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function fontFamily(
  input: string,
): RawToken<"fontFamily"> & ChainableMethods<RawToken<"fontFamily">> {
  const families = input
    .split(",")
    .map((f) => stripMatchingQuotes(f.trim()))
    .filter(Boolean);

  if (families.length === 0) {
    throw new Error(`Invalid fontFamily: ${JSON.stringify(input)}. Expected at least one family.`);
  }

  for (const family of families) {
    if (!FONT_FAMILY_NAME_RE.test(family)) {
      throw new Error(
        `Invalid fontFamily: ${JSON.stringify(input)}. Family names may only contain letters, digits, spaces, hyphens, underscores and dots.`,
      );
    }
  }

  return createRawToken("fontFamily", { value: families });
}

function fontWeight(
  input: number | FontWeightName,
): RawToken<"fontWeight"> & ChainableMethods<RawToken<"fontWeight">> {
  if (typeof input === "number") {
    if (!(input >= 1 && input <= 1000)) {
      throw new Error(`Invalid fontWeight: ${input}. Expected a number between 1 and 1000.`);
    }
    return createRawToken("fontWeight", { value: input });
  }

  if (typeof input !== "string" || !Object.hasOwn(FONT_WEIGHT_NUMERIC, input)) {
    throw new Error(
      `Invalid fontWeight: ${JSON.stringify(input)}. Expected a number (1-1000) or one of ${Object.keys(FONT_WEIGHT_NUMERIC).join(", ")}.`,
    );
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
  if (!Array.isArray(value) || value.length !== 4 || !value.every(Number.isFinite)) {
    throw new Error(`Invalid cubicBezier: ${JSON.stringify(value)}. Expected four finite numbers.`);
  }
  if (value[0] < 0 || value[0] > 1 || value[2] < 0 || value[2] > 1) {
    throw new Error(
      `Invalid cubicBezier: ${JSON.stringify(value)}. Expected x1 and x2 to be between 0 and 1.`,
    );
  }
  return createRawToken("cubicBezier", { value });
}

function number(value: number): RawToken<"number"> & ChainableMethods<RawToken<"number">> {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number: ${value}. Expected a finite number.`);
  }
  return createRawToken("number", { value });
}

function memberFromToken<T extends TokenType>(
  token: RawToken<T> | StampedToken<T>,
): TokenMember<T> {
  if ("_path" in token) {
    return {
      $value: token.$value as import("../token-model/values.js").TokenTypeMap[T],
      alias: token._path,
    };
  }
  return {
    $value: token.$value as import("../token-model/values.js").TokenTypeMap[T],
  };
}

function toMember<T extends TokenType>(
  expectedType: T,
  input: unknown,
  coerce: (raw: never) => RawToken<T>,
): TokenMember<T> {
  if (isStampedToken(input) || isRawToken(input)) {
    if (input.$type !== expectedType) {
      throw new Error(`Invalid member token type "${input.$type}": expected "${expectedType}".`);
    }
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
    toMember("dimension", item, (raw) => dimension(raw as string)),
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
    if (input.$type !== "shadow") {
      throw new Error(`Invalid shadow layer token type "${input.$type}": expected "shadow".`);
    }
    return memberFromToken(input);
  }

  if (!input.color || !input.offsetX || !input.offsetY || !input.blur || !input.spread) {
    throw new Error(
      "tokens.shadow(...) requires color, offsetX, offsetY, blur, and spread for every layer.",
    );
  }

  return {
    color: toMember("color", input.color, (raw) => color(raw as ColorInput)),
    offsetX: toMember("dimension", input.offsetX, (raw) => dimension(raw as string)),
    offsetY: toMember("dimension", input.offsetY, (raw) => dimension(raw as string)),
    blur: toMember("dimension", input.blur, (raw) => dimension(raw as string)),
    spread: toMember("dimension", input.spread, (raw) => dimension(raw as string)),
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
    color: toMember("color", input.color, (raw) => color(raw as ColorInput)),
    width: toMember("dimension", input.width, (raw) => dimension(raw as string)),
    style: toMember("strokeStyle", input.style ?? "solid", (raw) =>
      strokeStyle(raw as StrokeStyleInput),
    ),
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
    duration: toMember("duration", input.duration, (raw) => duration(raw as string)),
    delay: toMember("duration", input.delay ?? "0ms", (raw) => duration(raw as string)),
    timingFunction: toMember("cubicBezier", input.timingFunction, (raw) =>
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

const ANGLE_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:deg|grad|rad|turn)$/;
const GRADIENT_KINDS = new Set(["linear", "radial", "conic"]);

function clampPosition(position: number): number {
  if (!Number.isFinite(position)) {
    throw new Error(`Invalid gradient stop position: ${position}. Expected a finite number.`);
  }
  return Math.min(1, Math.max(0, position));
}

function toGradientStop(
  input: GradientStopInput | RawToken<"gradient"> | StampedToken<"gradient">,
): { color: TokenMember<"color">; position: TokenMember<"number"> } | TokenMember<"gradient"> {
  if (isStampedToken(input) || isRawToken(input)) {
    if (input.$type !== "gradient") {
      throw new Error(`Invalid gradient stop token type "${input.$type}": expected "gradient".`);
    }
    return memberFromToken(input);
  }

  if (!input || input.color === undefined || input.position === undefined) {
    throw new Error("tokens.gradient(...) requires color and position for every stop.");
  }

  return {
    color: toMember("color", input.color, (raw) => color(raw as ColorInput)),
    position: toMember("number", input.position, (raw) => number(clampPosition(raw as number))),
  };
}

function gradient(
  input: GradientInput,
): RawToken<"gradient"> & ChainableMethods<RawToken<"gradient">> {
  if (!input.stops || input.stops.length < 2) {
    throw new Error("tokens.gradient(...) requires at least 2 stops.");
  }

  const kind = input.kind ?? "linear";
  if (!GRADIENT_KINDS.has(kind)) {
    throw new Error(
      `Invalid gradient kind: ${JSON.stringify(kind)}. Expected "linear", "radial", or "conic".`,
    );
  }

  const angle = input.angle ?? "180deg";
  if (!ANGLE_RE.test(angle)) {
    throw new Error(
      `Invalid gradient angle: ${JSON.stringify(angle)}. Expected format like "90deg".`,
    );
  }

  const value: GradientValue = {
    kind,
    angle,
    stops: input.stops.map(toGradientStop),
  };
  return createRawToken("gradient", value);
}

type TypographyInput = {
  fontFamily: string | RawToken<"fontFamily"> | StampedToken<"fontFamily">;
  fontSize: string | RawToken<"dimension"> | StampedToken<"dimension">;
  fontWeight: number | FontWeightName | RawToken<"fontWeight"> | StampedToken<"fontWeight">;
  letterSpacing?: string | RawToken<"dimension"> | StampedToken<"dimension">;
  /** A unitless ratio, or a dimension ("58px", "1.5rem", "1.2em") that is converted to one against `fontSize`. */
  lineHeight?: number | string | RawToken<"number"> | StampedToken<"number">;
};

const REM_PX = 16;

function lineHeightRatio(
  lineHeight: DimensionValue,
  fontSize: DimensionValue,
  input: string,
): number {
  if (lineHeight.unit === "em") return lineHeight.value;
  if (fontSize.unit === "em") {
    throw new Error(
      `Invalid lineHeight ${JSON.stringify(input)}: cannot be converted against a fontSize in "em". Use a unitless number or an "em" lineHeight.`,
    );
  }
  const px = (size: DimensionValue) => (size.unit === "rem" ? size.value * REM_PX : size.value);
  const fontSizePx = px(fontSize);
  if (fontSizePx === 0) {
    throw new Error(
      `Invalid lineHeight ${JSON.stringify(input)}: cannot be converted against a fontSize of 0.`,
    );
  }
  return px(lineHeight) / fontSizePx;
}

function typography(
  input: TypographyInput,
): RawToken<"typography"> & ChainableMethods<RawToken<"typography">> {
  if (!input.fontFamily || !input.fontSize || input.fontWeight === undefined) {
    throw new Error("tokens.typography(...) requires fontFamily, fontSize, and fontWeight.");
  }

  const fontSize = toMember("dimension", input.fontSize, (raw) => dimension(raw as string));
  const lineHeight = toMember("number", input.lineHeight ?? 1.4, (raw) =>
    number(
      typeof raw === "string"
        ? roundTo(lineHeightRatio(dimension(raw).$value, fontSize.$value, raw), 4)
        : (raw as number),
    ),
  );

  const value: TypographyValue = {
    fontFamily: toMember("fontFamily", input.fontFamily, (raw) => fontFamily(raw as string)),
    fontSize,
    fontWeight: toMember("fontWeight", input.fontWeight, (raw) =>
      fontWeight(raw as number | FontWeightName),
    ),
    letterSpacing: toMember("dimension", input.letterSpacing ?? "0px", (raw) =>
      dimension(raw as string),
    ),
    lineHeight,
  };
  return createRawToken("typography", value);
}

type ChainableScaleMember<T extends TokenType> =
  | (RawToken<T> & ChainableMethods<RawToken<T>>)
  | (StampedToken<T> & ChainableMethods<StampedToken<T>>);

type ChainableScale<
  Key extends string | number,
  T extends TokenType,
  Value extends RawToken<T> | StampedToken<T> = ChainableScaleMember<T>,
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
): ChainableScale<Key, T, ChainableScaleMember<T>> {
  const result = Object.fromEntries(
    (Object.entries(scale) as Array<[string, Value]>).map(([step, input]) => {
      if (isTokenLeaf(input)) {
        if (input.$type !== type) {
          throw new Error(
            `Invalid scale member "${step}" of type "${input.$type}": expected "${type}".`,
          );
        }
        return [step, input as unknown as ChainableScaleMember<T>];
      }
      return [
        step,
        factory(input as Exclude<Value, RawToken<T> | StampedToken<T>>) as ChainableScaleMember<T>,
      ];
    }),
  ) as Record<Key, ChainableScaleMember<T>>;
  return createScale(type, result);
}

/** Groups tokens under a name and lets the group carry a description, deprecation or extensions. */
function group<T extends object>(tree: T): TokenGroup<T> {
  const copy = Object.fromEntries(Object.entries(tree)) as T;
  Object.defineProperty(copy, "_kind", { value: "group", enumerable: false });
  return withScaleMethods(copy) as unknown as TokenGroup<T>;
}

function colorScale<Key extends string | number>(
  scale: Record<Key, ColorInput | RawToken<"color"> | StampedToken<"color">>,
): ChainableScale<Key, "color"> {
  return scaleFrom("color", scale, color);
}

type ScaleStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
const DEFAULT_SCALE_STEPS: readonly ScaleStep[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type GenerateColorScaleInput<Key extends string | number> = {
  /**
   * The color the scale is built around. For an accent scale it is used verbatim as step 9,
   * unless it is close to the page background.
   */
  base: ColorInput | RawToken<"color"> | StampedToken<"color">;
  /**
   * Whether the scale sits on a white page ("light") or a near-black one ("dark").
   * Defaults to "light".
   */
  appearance?: "light" | "dark";
  /**
   * The opaque page color the scale sits on, which step 1 follows. Defaults to `#ffffff` for
   * "light" and `#111111` for "dark". `appearance` still chooses the reference scales.
   */
  background?: ColorInput | RawToken<"color"> | StampedToken<"color">;
  /**
   * Generate a gray scale (backgrounds, borders and text) tinted towards `base`, instead of
   * an accent scale. Step 9 is then not pinned to `base`.
   */
  neutral?: boolean;
  /** Exactly 12 keys for steps 1-12, from background to text. Defaults to 1..12. */
  steps?: readonly Key[];
};

function colorValueOf(input: ColorInput | RawToken<"color"> | StampedToken<"color">): ColorValue {
  if (isTokenLeaf(input)) {
    if (input.$type !== "color") {
      throw new Error(`Invalid color token type "${input.$type}": expected "color".`);
    }
    return input.$value as ColorValue;
  }
  return color(input).$value;
}

/**
 * Generates a 12-step UI color scale from a single color: the two closest hand-tuned reference scales are blended, re-hued to `base`, and
 * shifted to sit on the page background. Steps 1-2 are backgrounds, 3-5 interactive components, 6-8
 * borders, 9-10 solid colors (9 is `base`, 10 its hover state) and 11-12 text.
 * Generated steps are fitted to the sRGB gamut and emitted as oklch colors.
 */
function generateColorScale<Key extends string | number = ScaleStep>(
  input: GenerateColorScaleInput<Key>,
): ChainableScale<Key, "color"> {
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

  let background: [number, number, number] | undefined;
  if (input.background !== undefined) {
    const backgroundValue = colorValueOf(input.background);
    if (backgroundValue.alpha < 1) {
      throw new Error(
        `tokens.generateColorScale(...) requires an opaque background, received alpha ${backgroundValue.alpha}.`,
      );
    }
    background = toOklch(backgroundValue.colorSpace, backgroundValue.components);
  }

  const baseValue = colorValueOf(input.base);
  if (baseValue.alpha < 1) {
    throw new Error(
      `tokens.generateColorScale(...) requires an opaque base color, received alpha ${baseValue.alpha}.`,
    );
  }
  const { steps: generated, baseIndex } = generateScale({
    base: toOklch(baseValue.colorSpace, baseValue.components),
    baseHex: toSrgbHex(baseValue.colorSpace, baseValue.components),
    appearance,
    ...(background ? { background } : {}),
    neutral: input.neutral ?? false,
  });

  const scale = Object.create(null) as Record<
    Key,
    ColorInput | RawToken<"color"> | StampedToken<"color">
  >;
  steps.forEach((step, index) => {
    const value: ColorInput | RawToken<"color"> | StampedToken<"color"> =
      index === baseIndex
        ? input.base
        : (() => {
            const [l, c, h] = fitOklchToSrgb(generated[index]!);
            return {
              colorSpace: "oklch" as const,
              components: [roundTo(l, 4), floorTo(c, 4), roundTo(h, 2)] as [number, number, number],
            };
          })();
    Object.defineProperty(scale, step, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  });
  return colorScale(scale);
}

// Floors so that rounding can never push a gamut-fitted chroma back out of gamut.
function floorTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.floor(value * factor) / factor;
}

function dimensionScale<Key extends string | number>(
  scale: Record<Key, string | RawToken<"dimension"> | StampedToken<"dimension">>,
): ChainableScale<Key, "dimension"> {
  return scaleFrom("dimension", scale, dimension);
}

function numberScale<Key extends string | number>(
  scale: Record<Key, number | RawToken<"number"> | StampedToken<"number">>,
): ChainableScale<Key, "number"> {
  return scaleFrom("number", scale, number);
}

function fontFamilyScale<Key extends string | number>(
  scale: Record<Key, string | RawToken<"fontFamily"> | StampedToken<"fontFamily">>,
): ChainableScale<Key, "fontFamily"> {
  return scaleFrom("fontFamily", scale, fontFamily);
}

function fontWeightScale<Key extends string | number>(
  scale: Record<Key, number | FontWeightName | RawToken<"fontWeight"> | StampedToken<"fontWeight">>,
): ChainableScale<Key, "fontWeight"> {
  return scaleFrom("fontWeight", scale, fontWeight);
}

function durationScale<Key extends string | number>(
  scale: Record<Key, string | RawToken<"duration"> | StampedToken<"duration">>,
): ChainableScale<Key, "duration"> {
  return scaleFrom("duration", scale, duration);
}

function strokeStyleScale<Key extends string | number>(
  scale: Record<Key, StrokeStyleInput | RawToken<"strokeStyle"> | StampedToken<"strokeStyle">>,
): ChainableScale<Key, "strokeStyle"> {
  return scaleFrom("strokeStyle", scale, strokeStyle);
}

function borderScale<Key extends string | number>(
  scale: Record<Key, BorderInput | RawToken<"border"> | StampedToken<"border">>,
): ChainableScale<Key, "border"> {
  return scaleFrom("border", scale, border);
}

function cubicBezierScale<Key extends string | number>(
  scale: Record<
    Key,
    [number, number, number, number] | RawToken<"cubicBezier"> | StampedToken<"cubicBezier">
  >,
): ChainableScale<Key, "cubicBezier"> {
  return scaleFrom("cubicBezier", scale, cubicBezier);
}

function gradientScale<Key extends string | number>(
  scale: Record<Key, GradientInput | RawToken<"gradient"> | StampedToken<"gradient">>,
): ChainableScale<Key, "gradient"> {
  return scaleFrom("gradient", scale, gradient);
}

function transitionScale<Key extends string | number>(
  scale: Record<Key, TransitionInput | RawToken<"transition"> | StampedToken<"transition">>,
): ChainableScale<Key, "transition"> {
  return scaleFrom("transition", scale, transition);
}

function shadowScale<Key extends string | number>(
  scale: Record<
    Key,
    ShadowLayerInput | ShadowLayerInput[] | RawToken<"shadow"> | StampedToken<"shadow">
  >,
): ChainableScale<Key, "shadow"> {
  return scaleFrom("shadow", scale, shadow);
}

function typographyScale<Key extends string | number>(
  scale: Record<Key, TypographyInput | RawToken<"typography"> | StampedToken<"typography">>,
): ChainableScale<Key, "typography"> {
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
  fontFamilyScale,
  fontWeightScale,
  durationScale,
  strokeStyleScale,
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
  group,
};
