import {
  pathKey,
  type BorderValue,
  type ColorValue,
  type Config,
  type DimensionValue,
  type GradientValue,
  type NumberValue,
  type ShadowValue,
  type TokenEntry,
  type TokenMember,
  type TokenType,
  type TokenTypeMap,
  type TransitionValue,
  type TypographyValue,
} from "@recontentapp/core";
import { createLogger } from "../core/logger.js";
import {
  roundTo,
  serializeColorNative,
  serializeCubicBezierNative,
  serializeDimensionNative,
  serializeDurationNative,
  serializeFontFamilyNative,
  serializeFontWeightNative,
  serializeStrokeStyleNative,
} from "../core/generators/serialize-native.js";
import { escapeString } from "./shared/ts-source.js";
import {
  generateThemeSource,
  type LossReporter,
  type ThemeTargetSpec,
} from "./shared/theme-source.js";
import type { SourceTree, SourceValue } from "./shared/ts-source.js";
import type { OutputFile, OutputProcessor, TypeScriptNativeOutput } from "./index.js";

type MemberLookup = (memberAlias: string[]) => { ref?: string; value: TokenTypeMap[TokenType] };

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
  const layer = value.layers[0];
  if (!layer || !("color" in layer)) {
    throw new Error(
      `Token "${pathKey(entry.path)}" is a shadow whose first layer aliases another shadow token, which the "typescript-native" output target does not support.`,
    );
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

function nativeGradient(
  entry: TokenEntry,
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

  const stops = value.stops.map((stop) => {
    if (!("color" in stop)) {
      throw new Error(
        `Token "${pathKey(entry.path)}" is a gradient with a stop that aliases another gradient token, which the "typescript-native" output target does not support.`,
      );
    }
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

function generateTypeScriptNativeSource(config: Config, rootFontSize: number): string {
  const logger = createLogger(config.logLevel);
  const spec = createNativeSpec(rootFontSize);
  const body = generateThemeSource(config, spec, logger, "typescript-native");
  const themeConstNames = ["theme", ...Object.keys(config.themes).sort()];

  const lines = [
    body,
    `export const themes = { ${themeConstNames.join(", ")} } as const;`,
    "export type ThemeName = keyof typeof themes;",
    "export type Theme = (typeof themes)[ThemeName];",
    "export type BaseTheme = typeof theme;",
  ];

  return `${lines.join("\n")}\n`;
}

export const typescriptNativeOutputProcessor: OutputProcessor<TypeScriptNativeOutput> = {
  target: "typescript-native",
  generate(config: Config, output: TypeScriptNativeOutput): OutputFile[] {
    const rootFontSize = output.rootFontSize ?? DEFAULT_ROOT_FONT_SIZE;
    return [
      { filename: "tokens.ts", content: generateTypeScriptNativeSource(config, rootFontSize) },
    ];
  },
};

export type { LossReporter };
