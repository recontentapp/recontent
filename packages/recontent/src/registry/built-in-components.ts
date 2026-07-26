import type { StampedToken, TokenScale, TokenType } from "@recontentapp/core";
import type {
  ComponentContract,
  RegistryTokenType,
  ScaleContract,
  TokenContract,
  VariantContract,
} from "./types.js";

export type ScaleBinding<T extends TokenType = TokenType> = TokenScale<never, T, StampedToken<T>>;

export type TokenBinding<T extends TokenType = TokenType> = StampedToken<T>;

export type StackComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  gapScale: ScaleBinding<"dimension">;
};

export type BadgeVariantOptions = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  borderColor: TokenBinding<"color">;
};

export type BadgeComponentOptions = {
  gap: TokenBinding<"dimension">;
  height: TokenBinding<"dimension">;
  paddingInline: TokenBinding<"dimension">;
  borderRadius: TokenBinding<"dimension">;
  fontSize: TokenBinding<"dimension">;
  lineHeight: TokenBinding<"number">;
  fontWeight: TokenBinding<"fontWeight">;
  variants: Record<string, BadgeVariantOptions>;
};

export type DividerComponentOptions = {
  color: TokenBinding<"color">;
  thickness: TokenBinding<"dimension">;
};

export type SkeletonComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  borderRadius: TokenBinding<"dimension">;
};

export type StatusDotVariantOptions = {
  color: TokenBinding<"color">;
};

export type StatusDotComponentOptions = {
  size: TokenBinding<"dimension">;
  variants: Record<string, StatusDotVariantOptions>;
};

export type TextComponentOptions = {
  fontFamily: TokenBinding<"fontFamily">;
  fontSize: TokenBinding<"dimension">;
  lineHeight: TokenBinding<"number">;
  fontWeight: TokenBinding<"fontWeight">;
  color: TokenBinding<"color">;
};

export type HeadingLevelOptions = {
  fontSize: TokenBinding<"dimension">;
  lineHeight: TokenBinding<"number">;
  fontWeight: TokenBinding<"fontWeight">;
  color: TokenBinding<"color">;
};

export type HeadingComponentOptions = {
  fontFamily: TokenBinding<"fontFamily">;
  levels: Record<string, HeadingLevelOptions>;
};

export type KbdComponentOptions = {
  height: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  borderRadius: TokenBinding<"dimension">;
  borderWidth: TokenBinding<"dimension">;
  borderColor: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  paddingInline: TokenBinding<"dimension">;
  fontFamily: TokenBinding<"fontFamily">;
  fontSize: TokenBinding<"dimension">;
  fontWeight: TokenBinding<"fontWeight">;
  color: TokenBinding<"color">;
};

export type BlockquoteComponentOptions = {
  color: TokenBinding<"color">;
  borderColor: TokenBinding<"color">;
  borderWidth: TokenBinding<"dimension">;
  marginBlockStart: TokenBinding<"dimension">;
  paddingInlineStart: TokenBinding<"dimension">;
};

export type SupportingTextComponentOptions = {
  color: TokenBinding<"color">;
  fontSize: TokenBinding<"dimension">;
  lineHeight: TokenBinding<"number">;
  fontWeight: TokenBinding<"fontWeight">;
};

export type CardComponentOptions = {
  gap: TokenBinding<"dimension">;
  borderRadius: TokenBinding<"dimension">;
  borderWidth: TokenBinding<"dimension">;
  borderColor: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  padding: TokenBinding<"dimension">;
  headerGap: TokenBinding<"dimension">;
  titleFontSize: TokenBinding<"dimension">;
  titleFontWeight: TokenBinding<"fontWeight">;
  titleLineHeight: TokenBinding<"number">;
  descriptionFontSize: TokenBinding<"dimension">;
  descriptionColor: TokenBinding<"color">;
};

export type SectionComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  paddingBlock: TokenBinding<"dimension">;
  paddingInline: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
};

export type GridComponentOptions = {
  gapScale: ScaleBinding<"dimension">;
};

export type AspectRatioComponentOptions = Record<string, never>;
export type CenterComponentOptions = Record<string, never>;
export type GridSpanComponentOptions = Record<string, never>;
export type VisuallyHiddenComponentOptions = Record<string, never>;

export type BuiltInComponentOptions = {
  AspectRatio?: AspectRatioComponentOptions;
  Center?: CenterComponentOptions;
  Stack?: StackComponentOptions;
  Badge?: BadgeComponentOptions;
  Divider?: DividerComponentOptions;
  Skeleton?: SkeletonComponentOptions;
  StatusDot?: StatusDotComponentOptions;
  Text?: TextComponentOptions;
  Heading?: HeadingComponentOptions;
  Kbd?: KbdComponentOptions;
  Blockquote?: BlockquoteComponentOptions;
  Citation?: SupportingTextComponentOptions;
  Timestamp?: SupportingTextComponentOptions;
  Card?: CardComponentOptions;
  Section?: SectionComponentOptions;
  Grid?: GridComponentOptions;
  GridSpan?: GridSpanComponentOptions;
  VisuallyHidden?: VisuallyHiddenComponentOptions;
  [componentName: string]: Record<string, unknown> | undefined;
};

type TokenSchema<T extends RegistryTokenType> = {
  kind: "token";
  type: T;
  description?: string;
};

type ScaleSchema<T extends RegistryTokenType> = {
  kind: "scale";
  type: T;
  description?: string;
};

type VariantSchema<Fields> = {
  kind: "variants";
  fields: Fields;
  description?: string;
};

type BindingSchema<Value> =
  Value extends TokenBinding<infer Type>
    ? TokenSchema<Type>
    : Value extends ScaleBinding<infer Type>
      ? ScaleSchema<Type>
      : Value extends Record<string, infer Fields>
        ? VariantSchema<ComponentSchema<Fields>>
        : never;

type ComponentSchema<Options> = {
  [Key in keyof Options]-?: BindingSchema<Options[Key]>;
};

function defineComponentSchema<Options>() {
  return <const Schema extends ComponentSchema<Options>>(schema: Schema) => schema;
}

function schemaContracts(
  schema: Record<
    string,
    | TokenSchema<RegistryTokenType>
    | ScaleSchema<RegistryTokenType>
    | VariantSchema<Record<string, TokenSchema<RegistryTokenType>>>
  >,
): readonly ComponentContract[] {
  return Object.entries(schema).map(([key, entry]) => {
    if (entry.kind === "variants") {
      return {
        kind: "variants",
        key,
        required: true,
        fields: Object.entries(entry.fields).map(([fieldKey, field]) => ({
          kind: "token",
          key: fieldKey,
          type: field.type,
          required: true,
          description: field.description,
        })) as TokenContract[],
        description: entry.description,
      } satisfies VariantContract;
    }

    return {
      kind: entry.kind,
      key,
      type: entry.type,
      required: true,
      description: entry.description,
    } satisfies TokenContract | ScaleContract;
  });
}

const stackSchema = defineComponentSchema<StackComponentOptions>()({
  backgroundColor: { kind: "token", type: "color" },
  gapScale: {
    kind: "scale",
    type: "dimension",
    description: "Scale used by the Stack gap prop.",
  },
});
const badgeSchema = defineComponentSchema<BadgeComponentOptions>()({
  gap: { kind: "token", type: "dimension" },
  height: { kind: "token", type: "dimension" },
  paddingInline: { kind: "token", type: "dimension" },
  borderRadius: { kind: "token", type: "dimension" },
  fontSize: { kind: "token", type: "dimension" },
  lineHeight: { kind: "token", type: "number" },
  fontWeight: { kind: "token", type: "fontWeight" },
  variants: {
    kind: "variants",
    description: "Named Badge visual variants.",
    fields: {
      backgroundColor: { kind: "token", type: "color" },
      color: { kind: "token", type: "color" },
      borderColor: { kind: "token", type: "color" },
    },
  },
});
const dividerSchema = defineComponentSchema<DividerComponentOptions>()({
  color: { kind: "token", type: "color" },
  thickness: { kind: "token", type: "dimension" },
});
const skeletonSchema = defineComponentSchema<SkeletonComponentOptions>()({
  backgroundColor: { kind: "token", type: "color" },
  borderRadius: { kind: "token", type: "dimension" },
});
const statusDotSchema = defineComponentSchema<StatusDotComponentOptions>()({
  size: { kind: "token", type: "dimension" },
  variants: {
    kind: "variants",
    description: "Named StatusDot status colors.",
    fields: { color: { kind: "token", type: "color" } },
  },
});
const textSchema = defineComponentSchema<TextComponentOptions>()({
  fontFamily: { kind: "token", type: "fontFamily" },
  fontSize: { kind: "token", type: "dimension" },
  lineHeight: { kind: "token", type: "number" },
  fontWeight: { kind: "token", type: "fontWeight" },
  color: { kind: "token", type: "color" },
});
const headingSchema = defineComponentSchema<HeadingComponentOptions>()({
  fontFamily: { kind: "token", type: "fontFamily" },
  levels: {
    kind: "variants",
    description: "Typography bindings for Heading levels 1 through 6.",
    fields: {
      fontSize: { kind: "token", type: "dimension" },
      lineHeight: { kind: "token", type: "number" },
      fontWeight: { kind: "token", type: "fontWeight" },
      color: { kind: "token", type: "color" },
    },
  },
});
const kbdSchema = defineComponentSchema<KbdComponentOptions>()({
  height: { kind: "token", type: "dimension" },
  gap: { kind: "token", type: "dimension" },
  borderRadius: { kind: "token", type: "dimension" },
  borderWidth: { kind: "token", type: "dimension" },
  borderColor: { kind: "token", type: "color" },
  backgroundColor: { kind: "token", type: "color" },
  paddingInline: { kind: "token", type: "dimension" },
  fontFamily: { kind: "token", type: "fontFamily" },
  fontSize: { kind: "token", type: "dimension" },
  fontWeight: { kind: "token", type: "fontWeight" },
  color: { kind: "token", type: "color" },
});
const blockquoteSchema = defineComponentSchema<BlockquoteComponentOptions>()({
  color: { kind: "token", type: "color" },
  borderColor: { kind: "token", type: "color" },
  borderWidth: { kind: "token", type: "dimension" },
  marginBlockStart: { kind: "token", type: "dimension" },
  paddingInlineStart: { kind: "token", type: "dimension" },
});
const supportingTextSchema = defineComponentSchema<SupportingTextComponentOptions>()({
  color: { kind: "token", type: "color" },
  fontSize: { kind: "token", type: "dimension" },
  lineHeight: { kind: "token", type: "number" },
  fontWeight: { kind: "token", type: "fontWeight" },
});
const cardSchema = defineComponentSchema<CardComponentOptions>()({
  gap: { kind: "token", type: "dimension" },
  borderRadius: { kind: "token", type: "dimension" },
  borderWidth: { kind: "token", type: "dimension" },
  borderColor: { kind: "token", type: "color" },
  backgroundColor: { kind: "token", type: "color" },
  color: { kind: "token", type: "color" },
  padding: { kind: "token", type: "dimension" },
  headerGap: { kind: "token", type: "dimension" },
  titleFontSize: { kind: "token", type: "dimension" },
  titleFontWeight: { kind: "token", type: "fontWeight" },
  titleLineHeight: { kind: "token", type: "number" },
  descriptionFontSize: { kind: "token", type: "dimension" },
  descriptionColor: { kind: "token", type: "color" },
});
const sectionSchema = defineComponentSchema<SectionComponentOptions>()({
  backgroundColor: { kind: "token", type: "color" },
  color: { kind: "token", type: "color" },
  paddingBlock: { kind: "token", type: "dimension" },
  paddingInline: { kind: "token", type: "dimension" },
  gap: { kind: "token", type: "dimension" },
});
const gridSchema = defineComponentSchema<GridComponentOptions>()({
  gapScale: {
    kind: "scale",
    type: "dimension",
    description: "Scale used by the Grid gap prop.",
  },
});

export const builtInComponentContracts = {
  "aspect-ratio": [],
  center: [],
  stack: schemaContracts(stackSchema),
  badge: schemaContracts(badgeSchema),
  divider: schemaContracts(dividerSchema),
  skeleton: schemaContracts(skeletonSchema),
  "status-dot": schemaContracts(statusDotSchema),
  text: schemaContracts(textSchema),
  heading: schemaContracts(headingSchema),
  kbd: schemaContracts(kbdSchema),
  blockquote: schemaContracts(blockquoteSchema),
  citation: schemaContracts(supportingTextSchema),
  timestamp: schemaContracts(supportingTextSchema),
  card: schemaContracts(cardSchema),
  section: schemaContracts(sectionSchema),
  grid: schemaContracts(gridSchema),
  "grid-span": [],
  "visually-hidden": [],
} as const satisfies Record<string, readonly ComponentContract[]>;
