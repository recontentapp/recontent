import type {
  BorderValue,
  FontWeightName,
  GradientValue,
  ShadowLayer,
  ShadowValue,
  TokenEntry,
  TokenMember,
  TokenType,
  TokenTypeMap,
  TransitionValue,
  TypographyValue,
} from "@recontentapp/core";

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

export function serializeColorDtcg(value: TokenTypeMap["color"]): TokenTypeMap["color"] {
  return value;
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

function serializeStrokeStyleDtcg(value: TokenTypeMap["strokeStyle"]): unknown {
  if ("style" in value) {
    return value.style;
  }
  return { dashArray: value.dashArray, lineCap: value.lineCap };
}

function serializeStrokeStyleCss(value: TokenTypeMap["strokeStyle"]): string {
  if ("style" in value) {
    return value.style;
  }
  return "dashed";
}

function serializeCompositeDtcg(type: TokenType, value: unknown): unknown {
  switch (type) {
    case "shadow": {
      const shadow = value as ShadowValue;
      const layerNode = (layer: ShadowLayer) => ({
        color: serializeMemberDtcg("color", layer.color),
        offsetX: serializeMemberDtcg("dimension", layer.offsetX),
        offsetY: serializeMemberDtcg("dimension", layer.offsetY),
        blur: serializeMemberDtcg("dimension", layer.blur),
        spread: serializeMemberDtcg("dimension", layer.spread),
      });
      return shadow.layers.length === 1
        ? layerNode(shadow.layers[0]!)
        : shadow.layers.map(layerNode);
    }
    case "border": {
      const border = value as BorderValue;
      return {
        color: serializeMemberDtcg("color", border.color),
        width: serializeMemberDtcg("dimension", border.width),
        style: serializeMemberDtcg("strokeStyle", border.style),
      };
    }
    case "transition": {
      const transition = value as TransitionValue;
      return {
        duration: serializeMemberDtcg("duration", transition.duration),
        delay: serializeMemberDtcg("duration", transition.delay),
        timingFunction: serializeMemberDtcg("cubicBezier", transition.timingFunction),
      };
    }
    case "gradient": {
      const gradient = value as GradientValue;
      return gradient.stops.map((stop) => ({
        color: serializeMemberDtcg("color", stop.color),
        position: stop.position,
      }));
    }
    case "typography": {
      const typography = value as TypographyValue;
      return {
        fontFamily: serializeMemberDtcg("fontFamily", typography.fontFamily),
        fontSize: serializeMemberDtcg("dimension", typography.fontSize),
        fontWeight: serializeMemberDtcg("fontWeight", typography.fontWeight),
        letterSpacing: serializeMemberDtcg("dimension", typography.letterSpacing),
        lineHeight: serializeMemberDtcg("number", typography.lineHeight),
      };
    }
    default:
      throw new Error(`Unknown composite token type: ${type}`);
  }
}

export function serializeValueDtcg<T extends TokenType>(type: T, value: TokenTypeMap[T]): unknown {
  switch (type) {
    case "color":
      return serializeColorDtcg(value as TokenTypeMap["color"]);
    case "dimension":
      return value as TokenTypeMap["dimension"];
    case "fontFamily":
      return (value as TokenTypeMap["fontFamily"]).value;
    case "fontWeight":
      return serializeFontWeight(value as TokenTypeMap["fontWeight"]);
    case "duration":
      return value as TokenTypeMap["duration"];
    case "cubicBezier":
      return (value as TokenTypeMap["cubicBezier"]).value;
    case "number":
      return (value as TokenTypeMap["number"]).value;
    case "string":
      return (value as TokenTypeMap["string"]).value;
    case "strokeStyle":
      return serializeStrokeStyleDtcg(value as TokenTypeMap["strokeStyle"]);
    case "shadow":
    case "border":
    case "transition":
    case "gradient":
    case "typography":
      return serializeCompositeDtcg(type, value);
    default:
      throw new Error(`Unknown token type: ${type satisfies never}`);
  }
}

export function serializeMemberDtcg<T extends TokenType>(type: T, member: TokenMember<T>): unknown {
  return member.alias ? dtcgAliasReference(member.alias) : serializeValueDtcg(type, member.$value);
}

export type MemberResolver = (type: TokenType, member: TokenMember) => string;

export function serializeCompositeCss(
  type: "shadow" | "border" | "gradient",
  value: TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
  resolve: MemberResolver,
): string {
  switch (type) {
    case "shadow": {
      const shadow = value as ShadowValue;
      return shadow.layers
        .map((layer) => {
          const inset = layer.inset ? "inset " : "";
          return `${inset}${resolve("dimension", layer.offsetX)} ${resolve("dimension", layer.offsetY)} ${resolve("dimension", layer.blur)} ${resolve("dimension", layer.spread)} ${resolve("color", layer.color)}`;
        })
        .join(", ");
    }
    case "border": {
      const border = value as BorderValue;
      return `${resolve("dimension", border.width)} ${resolve("strokeStyle", border.style)} ${resolve("color", border.color)}`;
    }
    case "gradient": {
      const gradient = value as GradientValue;
      const stops = gradient.stops
        .map((stop) => `${resolve("color", stop.color)} ${stop.position * 100}%`)
        .join(", ");
      if (gradient.kind === "radial") {
        return `radial-gradient(${stops})`;
      }
      if (gradient.kind === "conic") {
        return `conic-gradient(from ${gradient.angle}, ${stops})`;
      }
      return `linear-gradient(${gradient.angle}, ${stops})`;
    }
    default:
      throw new Error(`Unknown inline composite token type: ${type satisfies never}`);
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
    case "strokeStyle":
      return serializeStrokeStyleCss(value as TokenTypeMap["strokeStyle"]);
    case "shadow":
    case "border":
    case "gradient": {
      const resolve: MemberResolver = (memberType, member) =>
        member.alias
          ? `var(${cssVarName(member.alias)})`
          : serializeValueCss(memberType, member.$value);
      return serializeCompositeCss(
        type as "shadow" | "border" | "gradient",
        value as TokenTypeMap["shadow"] | TokenTypeMap["border"] | TokenTypeMap["gradient"],
        resolve,
      );
    }
    case "typography":
    case "transition":
      throw new Error(
        `serializeValueCss cannot render a single CSS value for "${type}"; use expandedMembers(...) to emit its sub-variables instead.`,
      );
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

  const node: Record<string, unknown> = {
    $type: entry.$type,
    $value: serializeValueDtcg(entry.$type, entry.$value),
  };

  if (entry.$type === "gradient") {
    const gradient = entry.$value as TokenTypeMap["gradient"];
    node.$extensions = { "com.recontent": { kind: gradient.kind, angle: gradient.angle } };
  } else if (entry.$type === "shadow") {
    const shadow = entry.$value as TokenTypeMap["shadow"];
    if (shadow.layers.some((layer) => layer.inset)) {
      node.$extensions = {
        "com.recontent": { inset: shadow.layers.map((layer) => layer.inset ?? false) },
      };
    }
  }

  return node;
}
