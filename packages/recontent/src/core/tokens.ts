import type {
  BorderValue,
  ColorValue,
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
  StringValue,
  StrokeStyleName,
  StrokeStyleValue,
  TokenMember,
  TokenScale,
  TokenType,
  TransitionValue,
  TypographyValue,
} from "@recontentapp/core";
import { isRawToken, isStampedToken, isTokenLeaf } from "@recontentapp/core";

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

function strokeStyle(input: StrokeStyleInput): RawToken<"strokeStyle"> {
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

type ShadowLayerInput = {
  color: ColorInput | RawToken<"color"> | StampedToken<"color">;
  offsetX: string | RawToken<"dimension"> | StampedToken<"dimension">;
  offsetY: string | RawToken<"dimension"> | StampedToken<"dimension">;
  blur: string | RawToken<"dimension"> | StampedToken<"dimension">;
  spread: string | RawToken<"dimension"> | StampedToken<"dimension">;
  inset?: boolean;
};

function toShadowLayer(input: ShadowLayerInput): ShadowLayer {
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

function shadow(input: ShadowLayerInput | ShadowLayerInput[]): RawToken<"shadow"> {
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

function border(input: BorderInput): RawToken<"border"> {
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

function transition(input: TransitionInput): RawToken<"transition"> {
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
  position: number;
};
type GradientInput = {
  kind?: "linear" | "radial" | "conic";
  angle?: string;
  stops: GradientStopInput[];
};

function gradient(input: GradientInput): RawToken<"gradient"> {
  if (!input.stops || input.stops.length < 2) {
    throw new Error("tokens.gradient(...) requires at least 2 stops.");
  }
  for (const stop of input.stops) {
    if (typeof stop.position !== "number" || stop.position < 0 || stop.position > 1) {
      throw new Error(
        `Invalid gradient stop position: ${stop.position}. Expected a number between 0 and 1.`,
      );
    }
  }

  const value: GradientValue = {
    kind: input.kind ?? "linear",
    angle: input.angle ?? "180deg",
    stops: input.stops.map((stop) => ({
      color: toMember(stop.color, (raw) => color(raw as ColorInput)),
      position: stop.position,
    })),
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

function typography(input: TypographyInput): RawToken<"typography"> {
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
  StringValue,
  StrokeStyleValue,
  TransitionValue,
  TypographyValue,
};
