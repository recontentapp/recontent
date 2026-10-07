import type { ColorSpace, Component } from "../color/spaces.js";

export type ColorValue = {
  colorSpace: ColorSpace;
  components: [Component, Component, Component];
  alpha: number;
  hex: string;
};

export type DimensionValue = { value: number; unit: "px" | "rem" | "em" };
export type FontFamilyValue = { value: string[] };
export type FontWeightName =
  | "thin"
  | "hairline"
  | "extralight"
  | "extra-light"
  | "ultra-light"
  | "light"
  | "regular"
  | "normal"
  | "medium"
  | "book"
  | "semibold"
  | "semi-bold"
  | "demi-bold"
  | "bold"
  | "extrabold"
  | "extra-bold"
  | "ultra-bold"
  | "black"
  | "heavy"
  | "extrablack"
  | "extra-black"
  | "ultra-black";
export type FontWeightValue = { value: number | FontWeightName };
export const FONT_WEIGHT_NUMERIC: Record<FontWeightName, number> = {
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
export type DurationValue = { value: number; unit: "ms" | "s" };
export type CubicBezierValue = { value: [number, number, number, number] };
export type NumberValue = { value: number };

export type TokenMember<T extends TokenType = TokenType> = {
  $value: TokenTypeMap[T];
  alias?: string[];
};

export type StrokeStyleName =
  | "solid"
  | "dashed"
  | "dotted"
  | "double"
  | "groove"
  | "ridge"
  | "outset"
  | "inset";
export type StrokeStyleValue =
  | { style: StrokeStyleName }
  | { dashArray: DimensionValue[]; lineCap: "round" | "butt" | "square" };

export type ShadowLayer = {
  color: TokenMember<"color">;
  offsetX: TokenMember<"dimension">;
  offsetY: TokenMember<"dimension">;
  blur: TokenMember<"dimension">;
  spread: TokenMember<"dimension">;
  inset?: boolean;
};
export type ShadowValue = { layers: Array<ShadowLayer | TokenMember<"shadow">> };

export type BorderValue = {
  color: TokenMember<"color">;
  width: TokenMember<"dimension">;
  style: TokenMember<"strokeStyle">;
};
export type TransitionValue = {
  duration: TokenMember<"duration">;
  delay: TokenMember<"duration">;
  timingFunction: TokenMember<"cubicBezier">;
};
export type GradientStop = { color: TokenMember<"color">; position: TokenMember<"number"> };
export type GradientValue = {
  kind: "linear" | "radial" | "conic";
  angle: string;
  stops: Array<GradientStop | TokenMember<"gradient">>;
};
export type TypographyValue = {
  fontFamily: TokenMember<"fontFamily">;
  fontSize: TokenMember<"dimension">;
  fontWeight: TokenMember<"fontWeight">;
  letterSpacing: TokenMember<"dimension">;
  lineHeight: TokenMember<"number">;
};

export type TokenTypeMap = {
  color: ColorValue;
  dimension: DimensionValue;
  fontFamily: FontFamilyValue;
  fontWeight: FontWeightValue;
  duration: DurationValue;
  cubicBezier: CubicBezierValue;
  number: NumberValue;
  strokeStyle: StrokeStyleValue;
  shadow: ShadowValue;
  border: BorderValue;
  transition: TransitionValue;
  gradient: GradientValue;
  typography: TypographyValue;
};

export type TokenType = keyof TokenTypeMap;
