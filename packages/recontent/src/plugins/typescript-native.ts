import { pathKey } from "../token-model/guards.js";
import {
  type BorderValue,
  type ColorValue,
  type DimensionValue,
  type GradientValue,
  type NumberValue,
  type ShadowValue,
  type TokenMember,
  type TokenType,
  type TokenTypeMap,
  type TransitionValue,
  type TypographyValue,
} from "../token-model/values.js";
import { type RecontentPlugin } from "./types.js";
import { type TokenEntry } from "../token-model/registry.js";
import type { OutputFile } from "./shared/context.js";
import { createLogger } from "../logger.js";
import {
  roundTo,
  serializeColorNative,
  serializeCubicBezierNative,
  serializeDimensionNative,
  serializeDurationNative,
  serializeFontFamilyNative,
  serializeFontWeightNative,
  serializeStrokeStyleNative,
} from "../serialize/native.js";
import { escapeString } from "../ts-source.js";
import {
  generateThemeSource,
  themeNameDiagnostics,
  type MemberLookup,
  type ThemeTargetSpec,
} from "./shared/theme-source.js";
import type { SourceTree, SourceValue } from "../ts-source.js";
import type { GeneratorContext } from "./shared/context.js";
import { outputPlugin } from "./factory.js";
import { generateThemeModule, scaleExportsForConfig } from "./shared/ts-source.js";

const DEFAULT_ROOT_FONT_SIZE = 16;

function nativeScalarSourceValue(
  type: TokenType,
  value: TokenTypeMap[TokenType],
  rootFontSize: number,
  warn: (message: string) => void,
): SourceValue {
  switch (type) {
    case "dimension":
      return {
        value: String(serializeDimensionNative(value as TokenTypeMap["dimension"], rootFontSize)),
        source: true,
      };
    case "color": {
      const color = value as ColorValue;
      if (color.colorSpace !== "srgb") {
        warn(
          `color in colorSpace "${color.colorSpace}" is not representable as a plain hex string for the "typescript-native" target; using its closest sRGB approximation.`,
        );
      }
      return { value: serializeColorNative(color) };
    }
    case "duration":
      return {
        value: String(serializeDurationNative(value as TokenTypeMap["duration"])),
        source: true,
      };
    case "cubicBezier":
      return {
        value: `[${serializeCubicBezierNative(value as TokenTypeMap["cubicBezier"]).join(", ")}]`,
        source: true,
      };
    case "number":
      return { value: String((value as TokenTypeMap["number"]).value), source: true };
    case "fontFamily":
      return { value: serializeFontFamilyNative(value as TokenTypeMap["fontFamily"]) };
    case "fontWeight":
      return { value: serializeFontWeightNative(value as TokenTypeMap["fontWeight"]) };
    case "strokeStyle":
      return { value: serializeStrokeStyleNative(value as TokenTypeMap["strokeStyle"], warn) };
    default:
      throw new Error(
        `The "typescript-native" output target cannot serialize scalar type "${type}".`,
      );
  }
}

function rawMemberValue<T extends TokenType>(
  member: TokenMember<T>,
  lookup: MemberLookup,
): TokenTypeMap[T] {
  return member.alias ? (lookup(member.alias).value as TokenTypeMap[T]) : member.$value;
}

function nativeMemberValue(
  type: TokenType,
  member: TokenMember,
  lookup: MemberLookup,
  rootFontSize: number,
  warn: (message: string) => void,
): SourceValue {
  if (!member.alias) {
    return nativeScalarSourceValue(type, member.$value, rootFontSize, warn);
  }
  const resolved = lookup(member.alias);
  if (resolved.ref !== undefined) {
    return { value: resolved.ref, source: true };
  }
  return nativeScalarSourceValue(type, resolved.value, rootFontSize, warn);
}

function sourceValueText(value: SourceValue): string {
  return value.source ? value.value : `'${escapeString(value.value)}'`;
}

function nativeBorder(
  value: BorderValue,
  member: MemberLookup,
  rootFontSize: number,
  warn: (message: string) => void,
): SourceTree {
  return {
    borderColor: nativeMemberValue("color", value.color, member, rootFontSize, warn),
    borderWidth: nativeMemberValue("dimension", value.width, member, rootFontSize, warn),
    borderStyle: nativeMemberValue("strokeStyle", value.style, member, rootFontSize, warn),
  };
}

function nativeTransition(
  value: TransitionValue,
  member: MemberLookup,
  rootFontSize: number,
  warn: (message: string) => void,
): SourceTree {
  return {
    duration: nativeMemberValue("duration", value.duration, member, rootFontSize, warn),
    delay: nativeMemberValue("duration", value.delay, member, rootFontSize, warn),
    timingFunction: nativeMemberValue(
      "cubicBezier",
      value.timingFunction,
      member,
      rootFontSize,
      warn,
    ),
  };
}

function nativeTypography(
  value: TypographyValue,
  member: MemberLookup,
  rootFontSize: number,
  warn: (message: string) => void,
): SourceTree {
  const fontFamily = nativeMemberValue("fontFamily", value.fontFamily, member, rootFontSize, warn);
  const fontSize = nativeMemberValue("dimension", value.fontSize, member, rootFontSize, warn);
  const fontWeight = nativeMemberValue("fontWeight", value.fontWeight, member, rootFontSize, warn);
  const letterSpacing = nativeMemberValue(
    "dimension",
    value.letterSpacing,
    member,
    rootFontSize,
    warn,
  );

  const fontSizeValue = rawMemberValue(value.fontSize, member) as DimensionValue;
  const ratio = rawMemberValue(value.lineHeight, member) as NumberValue;
  const fontSizePx = serializeDimensionNative(fontSizeValue, rootFontSize);
  const lineHeightPx = roundTo(fontSizePx * ratio.value, 4);

  return {
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight: { value: String(lineHeightPx), source: true },
  };
}

function firstShadowLayer(
  value: ShadowValue,
  member: MemberLookup,
  visited = new Set<string>(),
): import("../token-model/values.js").ShadowLayer | undefined {
  const layer = value.layers[0];
  if (!layer) return undefined;
  if ("color" in layer) return layer;
  if (layer.alias) {
    const key = pathKey(layer.alias);
    if (visited.has(key)) return undefined;
    visited.add(key);
    const resolved = member(layer.alias).value as ShadowValue;
    return firstShadowLayer(resolved, member, visited);
  }
  return firstShadowLayer(layer.$value as ShadowValue, member, visited);
}

function nativeShadow(
  entry: TokenEntry,
  value: ShadowValue,
  member: MemberLookup,
  rootFontSize: number,
  warn: (message: string) => void,
): SourceTree {
  if (value.layers.length > 1) {
    warn(
      `shadow has ${value.layers.length} layers; the "typescript-native" target only supports a single shadow (using the first, dropping ${value.layers.length - 1}).`,
    );
  }
  const layer = firstShadowLayer(value, member);
  if (!layer) {
    throw new Error(`Token "${pathKey(entry.path)}" is a shadow with no resolvable layer.`);
  }
  if (layer.inset) {
    warn(`shadow "inset" has no React Native equivalent and was dropped.`);
  }
  const spread = rawMemberValue(layer.spread, member) as DimensionValue;
  if (spread.value !== 0) {
    warn(`shadow "spread" has no React Native equivalent and was dropped.`);
  }

  const color = rawMemberValue(layer.color, member) as ColorValue;
  if (color.colorSpace !== "srgb") {
    warn(
      `color in colorSpace "${color.colorSpace}" is not representable as a plain hex string for the "typescript-native" target; using its closest sRGB approximation.`,
    );
  }

  return {
    shadowColor: { value: color.hex },
    shadowOffset: {
      width: nativeMemberValue("dimension", layer.offsetX, member, rootFontSize, warn),
      height: nativeMemberValue("dimension", layer.offsetY, member, rootFontSize, warn),
    },
    shadowRadius: nativeMemberValue("dimension", layer.blur, member, rootFontSize, warn),
    shadowOpacity: { value: String(color.alpha), source: true },
  };
}

function flattenNativeGradientStops(
  stops: GradientValue["stops"],
  member: MemberLookup,
  visited = new Set<string | GradientValue>(),
): Array<{ color: TokenMember<"color">; position: TokenMember<"number"> }> {
  const result: Array<{ color: TokenMember<"color">; position: TokenMember<"number"> }> = [];
  for (const stop of stops) {
    if ("color" in stop) {
      result.push(stop);
      continue;
    }
    const nested = stop.alias
      ? (member(stop.alias).value as GradientValue)
      : (stop.$value as GradientValue);
    const key = stop.alias ? pathKey(stop.alias) : nested;
    if (visited.has(key)) {
      throw new Error("Circular gradient alias detected.");
    }
    visited.add(key);
    try {
      result.push(...flattenNativeGradientStops(nested.stops, member, visited));
    } finally {
      visited.delete(key);
    }
  }
  return result;
}

function nativeGradient(
  _entry: TokenEntry,
  value: GradientValue,
  member: MemberLookup,
  rootFontSize: number,
  warn: (message: string) => void,
): SourceTree {
  if (value.kind === "conic") {
    warn(
      `gradient kind "conic" has no direct expo-linear-gradient equivalent; it is passed through as-is.`,
    );
  }
  if (value.kind === "radial" && value.angle !== "180deg") {
    warn(
      `gradient "angle" is ignored by most React Native gradient libraries for radial gradients.`,
    );
  }

  const stops = flattenNativeGradientStops(value.stops, member).map((stop) => {
    const color = nativeMemberValue("color", stop.color, member, rootFontSize, warn);
    const position = nativeMemberValue("number", stop.position, member, rootFontSize, warn);
    return `{ color: ${sourceValueText(color)}, position: ${sourceValueText(position)} }`;
  });

  return {
    kind: { value: value.kind },
    angle: { value: value.angle },
    stops: { value: `[${stops.join(", ")}]`, source: true },
  };
}

function createNativeSpec(rootFontSize: number): ThemeTargetSpec {
  return {
    scalar(type, value, report, path): SourceValue {
      return nativeScalarSourceValue(type, value, rootFontSize, (message) => report(path, message));
    },
    composite(entry, resolved, member, report): SourceValue | SourceTree {
      const warn = (message: string) => report(entry.path, message);
      switch (entry.$type) {
        case "shadow":
          return nativeShadow(entry, resolved as ShadowValue, member, rootFontSize, warn);
        case "border":
          return nativeBorder(resolved as BorderValue, member, rootFontSize, warn);
        case "transition":
          return nativeTransition(resolved as TransitionValue, member, rootFontSize, warn);
        case "gradient":
          return nativeGradient(entry, resolved as GradientValue, member, rootFontSize, warn);
        case "typography":
          return nativeTypography(resolved as TypographyValue, member, rootFontSize, warn);
        default:
          throw new Error(
            `The "typescript-native" output target cannot serialize composite type "${entry.$type}".`,
          );
      }
    },
  };
}

function generateTypeScriptNativeSource(config: GeneratorContext, rootFontSize: number): string {
  const logger = config.logger ?? createLogger();
  const spec = createNativeSpec(rootFontSize);
  const scaleExports = scaleExportsForConfig(config);
  return generateThemeModule(
    config,
    generateThemeSource(config, spec, logger, "typescript-native", scaleExports),
    scaleExports,
  );
}

export type TypeScriptNativePluginOptions = {
  outDir: string;
  /** Defaults to `tokens.ts`. Set one when another plugin writes to the same `outDir`. */
  filename?: string;
  rootFontSize?: number;
};

function validateRootFontSize(rootFontSize: number | undefined): string | undefined {
  if (rootFontSize === undefined) return undefined;
  if (!Number.isFinite(rootFontSize) || rootFontSize <= 0) {
    return `Invalid rootFontSize: ${rootFontSize}. Expected a positive finite number.`;
  }
  return undefined;
}

export function generateTypeScriptNativeFiles(
  config: GeneratorContext,
  options: TypeScriptNativePluginOptions,
): OutputFile[] {
  const rootFontSizeError = validateRootFontSize(options.rootFontSize);
  if (rootFontSizeError) {
    throw new Error(rootFontSizeError);
  }
  const rootFontSize = options.rootFontSize ?? DEFAULT_ROOT_FONT_SIZE;
  return [
    {
      filename: options.filename ?? "tokens.ts",
      content: generateTypeScriptNativeSource(config, rootFontSize),
    },
  ];
}

export function typescriptNative(options: TypeScriptNativePluginOptions): RecontentPlugin {
  const checkNames = themeNameDiagnostics("typescript-native");
  return outputPlugin(
    "recontent:typescript-native",
    ["tokens"],
    options,
    generateTypeScriptNativeFiles,
    (ctx) => {
      const rootFontSizeError = validateRootFontSize(options.rootFontSize);
      return [
        ...(rootFontSizeError ? [{ severity: "error" as const, message: rootFontSizeError }] : []),
        ...checkNames(ctx),
      ];
    },
  );
}
