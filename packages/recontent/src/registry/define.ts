import type { ScaleBinding, TokenBinding, TokenType } from "@recontentapp/core";
import type {
  ComponentContract,
  ComponentOutput,
  RegistryOutputTarget,
  ScaleContract,
  TokenContract,
  VariantContract,
} from "./types.js";

type TokenSchema<T extends TokenType> = {
  kind: "token";
  type: T;
  description?: string;
  required?: boolean;
};

type ScaleSchema<T extends TokenType> = {
  kind: "scale";
  type: T;
  description?: string;
  required?: boolean;
};

type VariantSchema<Fields> = {
  kind: "variants";
  fields: Fields;
  description?: string;
  required?: boolean;
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

function schemaContracts(
  schema: Record<
    string,
    | TokenSchema<TokenType>
    | ScaleSchema<TokenType>
    | VariantSchema<Record<string, TokenSchema<TokenType>>>
  >,
): readonly ComponentContract[] {
  return Object.entries(schema).map(([key, entry]) => {
    const required = entry.required ?? true;

    if (entry.kind === "variants") {
      return {
        kind: "variants",
        key,
        required,
        fields: Object.entries(entry.fields).map(([fieldKey, field]) => ({
          kind: "token",
          key: fieldKey,
          type: field.type,
          required: field.required ?? true,
          description: field.description,
        })) as TokenContract[],
        description: entry.description,
      } satisfies VariantContract;
    }

    return {
      kind: entry.kind,
      key,
      type: entry.type,
      required,
      description: entry.description,
    } satisfies TokenContract | ScaleContract;
  });
}

export type RegistryComponentDefinition<Options = Record<string, unknown>> = {
  id: string;
  name: string;
  contracts: readonly ComponentContract[];
  dependencies: readonly string[];
  outputs: Partial<Record<RegistryOutputTarget, ComponentOutput>>;
  /** Phantom, never set at runtime — carries Options for BuiltInComponentOptions. */
  readonly __options?: Options;
};

export function defineRegistryComponent<Options>() {
  return <
    const S extends ComponentSchema<Options>,
    const Id extends string,
    const Name extends string,
  >(input: {
    id: Id;
    name: Name;
    schema: S;
    dependencies?: readonly string[];
    outputs: Partial<Record<RegistryOutputTarget, ComponentOutput>>;
  }): RegistryComponentDefinition<Options> & { id: Id; name: Name } => ({
    ...input,
    dependencies: input.dependencies ?? [],
    contracts: schemaContracts(input.schema),
  });
}
