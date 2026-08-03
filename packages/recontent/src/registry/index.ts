import { internalModules, registryComponents, type BuiltInComponentOptions } from "./manifest.js";
import type { RegistryComponentDefinition } from "./define.js";
import type { RegistryOutputTarget, ScaleImport, TokenImport } from "./types.js";
import { isStampedToken, isTokenScale, type Config, type TokenType } from "@recontentapp/core";
import type { OutputFile, VanillaExtractOutput } from "@recontentapp/core";

export class MissingDesignTokensError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(formatMissingDesignTokensMessage(errors));
    this.name = "MissingDesignTokensError";
    this.errors = errors;
  }
}

function formatMissingDesignTokensMessage(errors: string[]): string {
  const lines = [
    "Cannot generate built-in components because required design tokens are missing:",
    "",
    ...errors.map((error) => `  - ${error}`),
    "",
    "Add the missing tokens via defineComponentTokens() in your recontent.config.ts.",
  ];
  return lines.join("\n");
}

function findComponent(name: string): RegistryComponentDefinition | undefined {
  return (
    registryComponents[name] ??
    Object.values(registryComponents).find((component) => component.name === name)
  );
}

function availableComponents(): string {
  return Object.values(registryComponents)
    .map((component) => component.id)
    .sort()
    .join(", ");
}

export type BuiltInComponentSelection = {
  names: string[];
  options: BuiltInComponentOptions;
};

export function normalizeBuiltInComponents(
  builtInComponents: VanillaExtractOutput["builtInComponents"],
): BuiltInComponentSelection {
  if (!builtInComponents) {
    return { names: [], options: {} };
  }

  if (Array.isArray(builtInComponents)) {
    return { names: [...builtInComponents], options: {} };
  }

  return {
    names: Object.keys(builtInComponents),
    options: builtInComponents as BuiltInComponentOptions,
  };
}

function optionsForComponent(
  options: BuiltInComponentOptions,
  component: RegistryComponentDefinition,
): Record<string, unknown> {
  return ((options as Record<string, unknown>)[component.name] ?? {}) as Record<string, unknown>;
}

function scaleBindingDetails(
  value: unknown,
  expectedType: TokenType,
): {
  type: TokenType;
  keys: string[];
  layer: "ref" | "system" | "components";
} | null {
  if (!isTokenScale(value)) {
    return null;
  }

  const leaves = Object.values(value);
  const first = leaves[0];
  if (!first || !isStampedToken(first) || first.$type !== expectedType) {
    return null;
  }

  if (!value._path || !value._layer) {
    return null;
  }

  return {
    type: value.$type,
    keys: Object.keys(value),
    layer: value._layer,
  };
}

function isTokenBinding(value: unknown, expectedType: TokenType): boolean {
  return (
    isStampedToken(value) &&
    value.$type === expectedType &&
    Boolean(value._path) &&
    Boolean(value._layer)
  );
}

function validateVariants(
  componentId: string,
  contract: Extract<RegistryComponentDefinition["contracts"][number], { kind: "variants" }>,
  value: unknown,
  errors: string[],
): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(
      `Component "${componentId}" config "${contract.key}" must be a non-empty variant object.`,
    );
    return;
  }
  const variants = Object.entries(value as Record<string, unknown>);
  if (variants.length === 0) {
    errors.push(
      `Component "${componentId}" config "${contract.key}" must be a non-empty variant object.`,
    );
    return;
  }
  for (const [name, variant] of variants) {
    if (!variant || typeof variant !== "object" || Array.isArray(variant)) {
      errors.push(`Component "${componentId}" variant "${name}" must be an object.`);
      continue;
    }
    const values = variant as Record<string, unknown>;
    for (const field of contract.fields) {
      const binding = values[field.key];
      if (binding === undefined) {
        errors.push(`Component "${componentId}" variant "${name}" requires config "${field.key}".`);
      } else if (!isTokenBinding(binding, field.type as TokenType)) {
        errors.push(
          `Component "${componentId}" variant "${name}" config "${field.key}" must be a ${field.type} token defined in ref, system, or components tokens.`,
        );
      }
    }
  }
}

/**
 * Resolves requested component ids and their transitive dependencies in
 * deterministic dependency-first order.
 */
export function resolveBuiltInComponentIds(names: readonly string[]): string[] {
  const resolved: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (name: string): void => {
    const component = findComponent(name);
    if (!component) {
      throw new Error(
        `Unknown built-in component "${name}". Available components: ${availableComponents() || "(none)"}`,
      );
    }
    if (visited.has(component.id)) {
      return;
    }
    if (visiting.has(component.id)) {
      throw new Error(`Circular built-in component dependency detected at "${component.id}".`);
    }

    visiting.add(component.id);
    for (const dependency of component.dependencies) {
      visit(dependency);
    }
    visiting.delete(component.id);
    visited.add(component.id);
    resolved.push(component.id);
  };

  for (const name of names) {
    visit(name);
  }
  return resolved;
}

export function validateBuiltInComponents(
  config: Config,
  names: readonly string[],
  target: RegistryOutputTarget = "vanilla-extract",
  options: BuiltInComponentOptions = {},
): string[] {
  const errors: string[] = [];

  let ids: string[];
  try {
    ids = resolveBuiltInComponentIds(names);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  for (const id of ids) {
    const component = registryComponents[id];
    if (!component) {
      continue;
    }

    if (!component.outputs[target]) {
      errors.push(`Component "${component.id}" does not support the "${target}" output target.`);
      continue;
    }

    const componentOptions = optionsForComponent(options, component);
    for (const contract of component.contracts) {
      const binding = componentOptions[contract.key];
      if (binding === undefined) {
        if (contract.required) {
          errors.push(`Component "${component.id}" requires config "${contract.key}".`);
        }
        continue;
      }
      if (contract.kind === "variants") {
        validateVariants(component.id, contract, binding, errors);
        continue;
      }

      if (contract.kind === "token") {
        if (!isTokenBinding(binding, contract.type)) {
          errors.push(
            `Component "${component.id}" config "${contract.key}" must be a ${contract.type} token defined in ref, system, or components tokens.`,
          );
        }
        continue;
      }

      const details = scaleBindingDetails(binding, contract.type);
      if (!details) {
        errors.push(
          `Component "${component.id}" config "${contract.key}" must be a ${contract.type} TokenScale defined in ref, system, or components tokens.`,
        );
      }
    }
  }

  return errors;
}

export function generateBuiltInComponentFiles(
  names: readonly string[],
  target: RegistryOutputTarget = "vanilla-extract",
  options?: {
    scaleBindings?: Record<string, ScaleImport>;
    tokenBindings?: Record<string, TokenImport>;
  },
): OutputFile[] {
  return resolveBuiltInComponentIds(names).flatMap((id) => {
    const component = registryComponents[id];
    const output = component.outputs[target];
    if (!output) {
      throw new Error(
        `Component "${component.id}" does not support the "${target}" output target.`,
      );
    }
    const prefix = `${id}.`;
    const scales = Object.fromEntries(
      Object.entries(options?.scaleBindings ?? {})
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => [key.slice(prefix.length), value]),
    );
    const tokens = Object.fromEntries(
      Object.entries(options?.tokenBindings ?? {})
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => [key.slice(prefix.length), value]),
    );
    return output.generate({ scales, tokens });
  });
}

/**
 * Resolves the internal modules (e.g. `renderElement`) required by the given
 * resolved component ids, deduplicated in dependency-first order. Internal
 * modules are never user-selectable and are emitted at the output root.
 */
export function resolveInternalModuleIds(componentIds: readonly string[]): string[] {
  const resolved: string[] = [];
  const seen = new Set<string>();

  for (const componentId of componentIds) {
    const component = registryComponents[componentId];
    if (!component) continue;
    for (const moduleId of component.internalDependencies) {
      if (seen.has(moduleId)) continue;
      seen.add(moduleId);
      resolved.push(moduleId);
    }
  }

  return resolved;
}

export function generateInternalModuleFiles(
  componentIds: readonly string[],
  target: RegistryOutputTarget = "vanilla-extract",
): OutputFile[] {
  return resolveInternalModuleIds(componentIds).flatMap((id) => {
    const module = internalModules[id];
    const output = module?.outputs[target];
    if (!output) {
      throw new Error(`Internal module "${id}" does not support the "${target}" output target.`);
    }
    return output.generate();
  });
}

export function getInternalModuleDependencies(
  componentIds: readonly string[],
  target: RegistryOutputTarget = "vanilla-extract",
): Record<string, string> {
  const dependencies: Record<string, string> = {};
  for (const id of resolveInternalModuleIds(componentIds)) {
    const output = internalModules[id]?.outputs[target];
    if (output) {
      Object.assign(dependencies, output.runtimeDependencies);
    }
  }
  return dependencies;
}

export function getBuiltInComponentDependencies(
  names: readonly string[],
  target: RegistryOutputTarget = "vanilla-extract",
): Record<string, string> {
  const dependencies: Record<string, string> = {};
  for (const id of resolveBuiltInComponentIds(names)) {
    const output = registryComponents[id].outputs[target];
    if (output) {
      Object.assign(dependencies, output.runtimeDependencies);
    }
  }
  return dependencies;
}
