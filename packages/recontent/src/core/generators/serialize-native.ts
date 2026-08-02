import type { StrokeStyleName, TokenTypeMap } from "@recontentapp/core";
import { serializeColorCss, serializeFontWeight } from "./serialize.js";

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function serializeDimensionNative(
  value: TokenTypeMap["dimension"],
  rootFontSize: number,
): number {
  const px = value.unit === "rem" ? value.value * rootFontSize : value.value;
  return roundTo(px, 4);
}

export function serializeColorNative(value: TokenTypeMap["color"]): string {
  return serializeColorCss(value);
}

export function serializeDurationNative(value: TokenTypeMap["duration"]): number {
  const ms = value.unit === "s" ? value.value * 1000 : value.value;
  return roundTo(ms, 4);
}

export function serializeCubicBezierNative(
  value: TokenTypeMap["cubicBezier"],
): [number, number, number, number] {
  return value.value;
}

export function serializeFontFamilyNative(value: TokenTypeMap["fontFamily"]): string {
  return value.value[0] ?? "";
}

export function serializeFontWeightNative(value: TokenTypeMap["fontWeight"]): string {
  return String(serializeFontWeight(value));
}

const SUPPORTED_NATIVE_STROKE_STYLES: ReadonlySet<StrokeStyleName> = new Set([
  "solid",
  "dashed",
  "dotted",
]);

export function serializeStrokeStyleNative(
  value: TokenTypeMap["strokeStyle"],
  report: (message: string) => void,
): "solid" | "dashed" | "dotted" {
  if ("dashArray" in value) {
    report(
      `strokeStyle with a custom "dashArray"/"lineCap" has no React Native equivalent; using "dashed".`,
    );
    return "dashed";
  }
  if (SUPPORTED_NATIVE_STROKE_STYLES.has(value.style)) {
    return value.style as "solid" | "dashed" | "dotted";
  }
  report(`strokeStyle "${value.style}" has no React Native equivalent; using "solid".`);
  return "solid";
}
