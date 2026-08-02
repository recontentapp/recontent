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

export type BuiltInComponentOptions = {
  Stack?: StackComponentOptions;
  [key: string]: Record<string, unknown> | undefined;
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

export const builtInComponentContracts = {
  stack: schemaContracts(stackSchema),
} as const satisfies Record<string, readonly ComponentContract[]>;
