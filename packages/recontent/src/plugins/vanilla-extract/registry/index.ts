import {
  componentsByName,
  internalModules,
  registryComponents,
  type BuiltInComponentOptions,
} from "./manifest.js";
import type { RegistryComponentDefinition } from "./define.js";
import type { BreakpointBinding, ScaleImport, TokenImport } from "./types.js";
import { isStampedToken, isTokenScale, type TokenType } from "@recontentapp/core";
import type { OutputFile } from "@recontentapp/core";
import type { GeneratorContext } from "../../../outputs/shared/context.js";
export { MissingDesignTokensError } from "../../errors.js";

export function formatMissingDesignTokensMessage(errors: string[]): string {
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
  return registryComponents[name] ?? componentsByName[name];
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
  builtInComponents: BuiltInComponentOptions | readonly string[] | undefined,
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

function isScaleBinding(value: unknown, expectedType: TokenType): boolean {
  if (!isTokenScale(value)) {
    return false;
  }

  const leaves = Object.values(value);
  const first = leaves[0];
  if (!first || !isStampedToken(first) || first.$type !== expectedType) {
    return false;
  }

  return Boolean(value._path) && Boolean(value._layer);
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
      } else if (field.kind === "icon") {
        if (typeof binding !== "string" || binding.length === 0) {
          errors.push(
            `Component "${componentId}" variant "${name}" config "${field.key}" must be a non-empty icon name string.`,
          );
        }
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
  config: GeneratorContext,
  names: readonly string[],
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

      if (contract.kind === "icon") {
        if (typeof binding !== "string" || binding.length === 0) {
          errors.push(
            `Component "${component.id}" config "${contract.key}" must be a non-empty icon name string.`,
          );
        }
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

      if (!isScaleBinding(binding, contract.type)) {
        errors.push(
          `Component "${component.id}" config "${contract.key}" must be a ${contract.type} TokenScale defined in ref, system, or components tokens.`,
        );
      }
    }
  }

  return errors;
}

/**
 * Groups `"<componentId>.<rest>": value` bindings by their component id,
 * stripping the id prefix — a single pass shared across all resolved
 * components, instead of each component re-filtering the whole map.
 */
function bucketByComponentId<T>(
  bindings: Record<string, T> | undefined,
): Map<string, Record<string, T>> {
  const buckets = new Map<string, Record<string, T>>();
  for (const [key, value] of Object.entries(bindings ?? {})) {
    const dot = key.indexOf(".");
    if (dot === -1) continue;
    const id = key.slice(0, dot);
    const rest = key.slice(dot + 1);
    const bucket = buckets.get(id);
    if (bucket) {
      bucket[rest] = value;
    } else {
      buckets.set(id, { [rest]: value });
    }
  }
  return buckets;
}

export function generateBuiltInComponentFiles(
  resolvedComponentIds: readonly string[],
  options?: {
    scaleBindings?: Record<string, ScaleImport>;
    tokenBindings?: Record<string, TokenImport>;
    iconBindings?: Record<string, string>;
    breakpoints?: readonly BreakpointBinding[];
    focusRingColor?: TokenImport;
  },
): OutputFile[] {
  const scaleBuckets = bucketByComponentId(options?.scaleBindings);
  const tokenBuckets = bucketByComponentId(options?.tokenBindings);
  const iconBuckets = bucketByComponentId(options?.iconBindings);

  return resolvedComponentIds.flatMap((id) => {
    const component = registryComponents[id];
    const output = component.output;
    return output.generate({
      scales: scaleBuckets.get(id) ?? {},
      tokens: tokenBuckets.get(id) ?? {},
      icons: iconBuckets.get(id) ?? {},
      breakpoints: options?.breakpoints,
      focusRingColor: options?.focusRingColor,
    });
  });
}

/**
 * Resolves the internal modules (e.g. `renderElement`) required by the given
 * resolved component ids, deduplicated in dependency-first order. Internal
 * modules are never user-selectable and are emitted at the output root.
 */
function resolveInternalModuleIds(componentIds: readonly string[]): string[] {
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

/**
 * Internal modules that only make sense when `breakpoints` is configured.
 * They are skipped even if a component statically declares a dependency on
 * them, so unconfigured projects keep byte-identical output.
 */
const BREAKPOINT_GATED_MODULES = new Set(["responsive"]);

export function generateInternalModuleFiles(
  componentIds: readonly string[],
  breakpoints?: readonly BreakpointBinding[],
  iconBindings?: Record<string, string>,
): OutputFile[] {
  const iconNames = [...new Set(Object.values(iconBindings ?? {}))];
  return resolveInternalModuleIds(componentIds).flatMap((id) => {
    if (BREAKPOINT_GATED_MODULES.has(id) && breakpoints === undefined) {
      return [];
    }
    const module = internalModules[id];
    const output = module?.output;
    if (!output) {
      return [];
    }
    return output.generate({ breakpoints, iconNames });
  });
}

export function getInternalModuleDependencies(
  componentIds: readonly string[],
  breakpoints?: readonly BreakpointBinding[],
): Record<string, string> {
  const dependencies: Record<string, string> = {};
  for (const id of resolveInternalModuleIds(componentIds)) {
    if (BREAKPOINT_GATED_MODULES.has(id) && breakpoints === undefined) {
      continue;
    }
    const output = internalModules[id]?.output;
    if (output) {
      Object.assign(dependencies, output.runtimeDependencies);
    }
  }
  return dependencies;
}

/**
 * `useBreakpoint`/`useMediaQuery` are consumer-facing utilities, not a
 * dependency of any generated component body, so they are not wired into the
 * component dependency graph above. They are emitted directly whenever
 * `breakpoints` is configured.
 */
export function generateUseBreakpointFiles(
  breakpoints: readonly BreakpointBinding[] | undefined,
): OutputFile[] {
  if (breakpoints === undefined) {
    return [];
  }
  const output = internalModules["use-breakpoint"]?.output;
  if (!output) {
    return [];
  }
  return output.generate({ breakpoints });
}

export function getUseBreakpointDependencies(
  breakpoints: readonly BreakpointBinding[] | undefined,
): Record<string, string> {
  if (breakpoints === undefined) {
    return {};
  }
  return internalModules["use-breakpoint"]?.output?.runtimeDependencies ?? {};
}

export function getBuiltInComponentDependencies(
  resolvedComponentIds: readonly string[],
): Record<string, string> {
  const dependencies: Record<string, string> = {};
  for (const id of resolvedComponentIds) {
    const output = registryComponents[id].output;
    Object.assign(dependencies, output.runtimeDependencies);
  }
  return dependencies;
}
