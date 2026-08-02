export type RegistryOutputTarget = "vanilla-extract";

export type ScaleImport = {
  typeName: string;
  exportName: string;
};

export type TokenImport = {
  reference: string;
};

export type ComponentSourceFiles = {
  styles: string;
  component: string;
};

export type ComponentSourceGenerator = (bindings: {
  scales: Record<string, ScaleImport>;
  tokens: Record<string, TokenImport>;
}) => ComponentSourceFiles;

export type RegistryTokenType =
  | "color"
  | "dimension"
  | "fontFamily"
  | "fontWeight"
  | "duration"
  | "cubicBezier"
  | "number"
  | "strokeStyle"
  | "shadow"
  | "border"
  | "transition"
  | "gradient"
  | "typography";

export type TokenContract = {
  kind: "token";
  key: string;
  type: RegistryTokenType;
  required?: boolean;
  description?: string;
};

export type ScaleContract = {
  kind: "scale";
  key: string;
  type: RegistryTokenType;
  required?: boolean;
  description?: string;
};

export type VariantContract = {
  kind: "variants";
  key: string;
  fields: readonly TokenContract[];
  required?: boolean;
  description?: string;
};

export type ComponentContract = TokenContract | ScaleContract | VariantContract;

export type OutputArtifact = {
  path: string;
};

export type ComponentOutput = {
  artifacts: OutputArtifact[];
  runtimeDependencies: Record<string, string>;
};

export type RegistryComponentDefinition = {
  id: string;
  name: string;
  contracts: readonly ComponentContract[];
  dependencies: readonly string[];
  outputs: Partial<Record<RegistryOutputTarget, ComponentOutput>>;
};

export type RegistryManifest = {
  version: 1;
  components: Record<string, RegistryComponentDefinition>;
};
