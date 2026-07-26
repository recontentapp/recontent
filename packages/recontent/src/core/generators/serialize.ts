import type { FontWeightName, TokenEntry, TokenType, TokenTypeMap } from "@recontentapp/core";

const FONT_WEIGHT_NUMERIC: Record<FontWeightName, number> = {
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

export function serializeColorDtcg(value: TokenTypeMap["color"]): string {
  if (value.colorSpace === "srgb") {
    return value.hex;
  }
  const [r, g, b] = value.components;
  const alpha = value.alpha < 1 ? ` / ${value.alpha}` : "";
  return `color(${value.colorSpace} ${r} ${g} ${b}${alpha})`;
}

export function serializeColorCss(value: TokenTypeMap["color"]): string {
  if (value.colorSpace === "srgb") {
    return value.hex;
  }
  const [r, g, b] = value.components;
  if (value.alpha < 1) {
    return `color(${value.colorSpace} ${r} ${g} ${b} / ${value.alpha})`;
  }
  return `color(${value.colorSpace} ${r} ${g} ${b})`;
}

export function serializeFontWeight(value: TokenTypeMap["fontWeight"]): number {
  if (typeof value.value === "number") {
    return value.value;
  }
  return FONT_WEIGHT_NUMERIC[value.value];
}

export function serializeValueDtcg<T extends TokenType>(type: T, value: TokenTypeMap[T]): unknown {
  switch (type) {
    case "color":
      return serializeColorDtcg(value as TokenTypeMap["color"]);
    case "dimension": {
      const v = value as TokenTypeMap["dimension"];
      return `${v.value}${v.unit}`;
    }
    case "fontFamily":
      return (value as TokenTypeMap["fontFamily"]).value;
    case "fontWeight":
      return serializeFontWeight(value as TokenTypeMap["fontWeight"]);
    case "duration": {
      const v = value as TokenTypeMap["duration"];
      return `${v.value}${v.unit}`;
    }
    case "cubicBezier":
      return (value as TokenTypeMap["cubicBezier"]).value;
    case "number":
      return (value as TokenTypeMap["number"]).value;
    case "string":
      return (value as TokenTypeMap["string"]).value;
    default:
      throw new Error(`Unknown token type: ${type satisfies never}`);
  }
}

export function serializeValueCss<T extends TokenType>(type: T, value: TokenTypeMap[T]): string {
  switch (type) {
    case "color":
      return serializeColorCss(value as TokenTypeMap["color"]);
    case "dimension": {
      const v = value as TokenTypeMap["dimension"];
      return `${v.value}${v.unit}`;
    }
    case "fontFamily":
      return (value as TokenTypeMap["fontFamily"]).value.join(", ");
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
    case "string":
      return (value as TokenTypeMap["string"]).value;
    default:
      throw new Error(`Unknown token type: ${type satisfies never}`);
  }
}

export function cssVarName(path: string[]): string {
  return `--${path.join("-")}`;
}

export function dtcgAliasReference(path: string[]): string {
  return `{${path.join(".")}}`;
}

export function setNested(target: Record<string, unknown>, path: string[], value: unknown): void {
  let current = target;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]!;
    if (!(segment in current)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }
  current[path[path.length - 1]!] = value;
}

export function entryToDtcgNode(entry: TokenEntry): Record<string, unknown> {
  if (entry.alias) {
    return {
      $type: entry.$type,
      $value: dtcgAliasReference(entry.alias),
    };
  }

  return {
    $type: entry.$type,
    $value: serializeValueDtcg(entry.$type, entry.$value),
  };
}
