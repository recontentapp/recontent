import type { OutputFile, TokenType } from "@recontentapp/core";

export type RegistryOutputTarget = "vanilla-extract";

export type ScaleImport = {
  typeName: string;
  exportName: string;
};

export type TokenImport = {
  reference: string;
};

/**
 * A single resolved breakpoint condition. `query` is `null` for the base
 * condition (the first breakpoint, which must resolve to `0`) and a literal
 * `@media` condition string for every other breakpoint.
 */
export type BreakpointBinding = {
  name: string;
  query: string | null;
};

export type ComponentSourceFiles = {
  styles: string;
  component: string;
};

export type TokenContract = {
  kind: "token";
  key: string;
  type: TokenType;
  required?: boolean;
  description?: string;
};

export type ScaleContract = {
  kind: "scale";
  key: string;
  type: TokenType;
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

export type ComponentOutput = {
  runtimeDependencies: Record<string, string>;
  generate(bindings: {
    scales: Record<string, ScaleImport>;
    tokens: Record<string, TokenImport>;
    breakpoints?: readonly BreakpointBinding[];
  }): OutputFile[];
};

type InternalModuleOutput = {
  runtimeDependencies: Record<string, string>;
  generate(breakpoints?: readonly BreakpointBinding[]): OutputFile[];
};

export type InternalModuleDefinition = {
  id: string;
  outputs: Partial<Record<RegistryOutputTarget, InternalModuleOutput>>;
};
