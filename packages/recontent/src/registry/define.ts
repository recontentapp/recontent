import type { ScaleBinding, TokenBinding, TokenType } from "@recontentapp/core";
import type { IconName } from "./internal/icon-map/icons.js";
import type {
  ComponentContract,
  ComponentOutput,
  IconContract,
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

type IconSchema = {
  kind: "icon";
  description?: string;
  required?: boolean;
};

type BindingSchema<Value> =
  Value extends TokenBinding<infer Type>
    ? TokenSchema<Type>
    : Value extends ScaleBinding<infer Type>
      ? ScaleSchema<Type>
      : Value extends IconName | undefined
        ? IconSchema
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
    | VariantSchema<Record<string, TokenSchema<TokenType> | IconSchema>>
    | IconSchema
  >,
): readonly ComponentContract[] {
  return Object.entries(schema).map(([key, entry]) => {
    if (entry.kind === "variants") {
      return {
        kind: "variants",
        key,
        required: entry.required ?? true,
        fields: Object.entries(entry.fields).map(([fieldKey, field]) =>
          field.kind === "icon"
            ? ({
                kind: "icon",
                key: fieldKey,
                required: field.required ?? true,
                description: field.description,
              } satisfies IconContract)
            : ({
                kind: "token",
                key: fieldKey,
                type: field.type,
                required: field.required ?? true,
                description: field.description,
              } satisfies TokenContract),
        ),
        description: entry.description,
      } satisfies VariantContract;
    }

    if (entry.kind === "icon") {
      return {
        kind: "icon",
        key,
        // Icon names have no built-in default (they're free-form strings
        // chosen per project), so unlike tokens they must be explicitly
        // bound unless a schema entry opts out.
        required: entry.required ?? true,
        description: entry.description,
      } satisfies IconContract;
    }

    const required = entry.required ?? true;

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
  internalDependencies: readonly string[];
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
    internalDependencies?: readonly string[];
    outputs: Partial<Record<RegistryOutputTarget, ComponentOutput>>;
  }): RegistryComponentDefinition<Options> & { id: Id; name: Name } => ({
    ...input,
    dependencies: input.dependencies ?? [],
    internalDependencies: input.internalDependencies ?? [],
    contracts: schemaContracts(input.schema),
  });
}
