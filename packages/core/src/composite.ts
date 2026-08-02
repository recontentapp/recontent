import type {
  BorderValue,
  GradientValue,
  ShadowValue,
  TokenMember,
  TokenType,
  TokenTypeMap,
  TransitionValue,
  TypographyValue,
} from "./types.js";

export const COMPOSITE_TOKEN_TYPES = [
  "shadow",
  "border",
  "transition",
  "gradient",
  "typography",
] as const satisfies readonly TokenType[];

export type CompositeTokenType = (typeof COMPOSITE_TOKEN_TYPES)[number];

export function isCompositeType(type: TokenType): type is CompositeTokenType {
  return (COMPOSITE_TOKEN_TYPES as readonly TokenType[]).includes(type);
}

export const EXPANDED_COMPOSITE_TYPES = [
  "typography",
  "transition",
] as const satisfies readonly CompositeTokenType[];

export type ExpandedCompositeType = (typeof EXPANDED_COMPOSITE_TYPES)[number];

export function isExpandedComposite(type: TokenType): type is ExpandedCompositeType {
  return (EXPANDED_COMPOSITE_TYPES as readonly TokenType[]).includes(type);
}

export type CompositeMember = { key: string; type: TokenType; member: TokenMember };

export function compositeMembers(
  type: CompositeTokenType,
  value: TokenTypeMap[CompositeTokenType],
): CompositeMember[] {
  switch (type) {
    case "shadow": {
      const shadow = value as ShadowValue;
      const members: CompositeMember[] = [];
      shadow.layers.forEach((layer, index) => {
        if (!("color" in layer)) {
          members.push({ key: `layers.${index}`, type: "shadow", member: layer });
          return;
        }
        members.push(
          { key: `layers.${index}.color`, type: "color", member: layer.color },
          { key: `layers.${index}.offsetX`, type: "dimension", member: layer.offsetX },
          { key: `layers.${index}.offsetY`, type: "dimension", member: layer.offsetY },
          { key: `layers.${index}.blur`, type: "dimension", member: layer.blur },
          { key: `layers.${index}.spread`, type: "dimension", member: layer.spread },
        );
      });
      return members;
    }
    case "border": {
      const border = value as BorderValue;
      return [
        { key: "color", type: "color", member: border.color },
        { key: "width", type: "dimension", member: border.width },
        { key: "style", type: "strokeStyle", member: border.style },
      ];
    }
    case "transition": {
      const transition = value as TransitionValue;
      return [
        { key: "duration", type: "duration", member: transition.duration },
        { key: "delay", type: "duration", member: transition.delay },
        { key: "timingFunction", type: "cubicBezier", member: transition.timingFunction },
      ];
    }
    case "gradient": {
      const gradient = value as GradientValue;
      const members: CompositeMember[] = [];
      gradient.stops.forEach((stop, index) => {
        if (!("color" in stop)) {
          members.push({ key: `stops.${index}`, type: "gradient", member: stop });
          return;
        }
        members.push(
          { key: `stops.${index}.color`, type: "color", member: stop.color },
          { key: `stops.${index}.position`, type: "number", member: stop.position },
        );
      });
      return members;
    }
    case "typography": {
      const typography = value as TypographyValue;
      return [
        { key: "fontFamily", type: "fontFamily", member: typography.fontFamily },
        { key: "fontSize", type: "dimension", member: typography.fontSize },
        { key: "fontWeight", type: "fontWeight", member: typography.fontWeight },
        { key: "letterSpacing", type: "dimension", member: typography.letterSpacing },
        { key: "lineHeight", type: "number", member: typography.lineHeight },
      ];
    }
    default:
      throw new Error(`Unknown composite token type: ${type satisfies never}`);
  }
}

export type ExpandedMember = {
  cssProperty: string;
  varSuffix: string;
  type: TokenType;
  member: TokenMember;
};

export function expandedMembers(
  type: ExpandedCompositeType,
  value: TokenTypeMap[ExpandedCompositeType],
): ExpandedMember[] {
  switch (type) {
    case "typography": {
      const typography = value as TypographyValue;
      return [
        {
          cssProperty: "fontFamily",
          varSuffix: "font-family",
          type: "fontFamily",
          member: typography.fontFamily,
        },
        {
          cssProperty: "fontSize",
          varSuffix: "font-size",
          type: "dimension",
          member: typography.fontSize,
        },
        {
          cssProperty: "fontWeight",
          varSuffix: "font-weight",
          type: "fontWeight",
          member: typography.fontWeight,
        },
        {
          cssProperty: "letterSpacing",
          varSuffix: "letter-spacing",
          type: "dimension",
          member: typography.letterSpacing,
        },
        {
          cssProperty: "lineHeight",
          varSuffix: "line-height",
          type: "number",
          member: typography.lineHeight,
        },
      ];
    }
    case "transition": {
      const transition = value as TransitionValue;
      return [
        {
          cssProperty: "transitionDuration",
          varSuffix: "transition-duration",
          type: "duration",
          member: transition.duration,
        },
        {
          cssProperty: "transitionDelay",
          varSuffix: "transition-delay",
          type: "duration",
          member: transition.delay,
        },
        {
          cssProperty: "transitionTimingFunction",
          varSuffix: "transition-timing-function",
          type: "cubicBezier",
          member: transition.timingFunction,
        },
      ];
    }
    default:
      throw new Error(`Unknown expanded composite token type: ${type satisfies never}`);
  }
}
